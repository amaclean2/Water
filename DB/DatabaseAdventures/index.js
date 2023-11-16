const DataLayer = require('..')
const { AdventureObject } = require('../../TypeDefs/adventures')
const {
  selectAdventuresStatement,
  updateAdventureStatements,
  searchAdventureStatement,
  addKeywordStatement,
  deleteSkiStatement,
  deleteClimbStatement,
  deleteHikeStatement,
  getKeywordsStatement,
  selectAdventureByIdGroup,
  createNewClimbStatement,
  createNewHikeStatement,
  createNewSkiStatement,
  createNewSkiAdventureStatement,
  createNewClimbAdventureStatement,
  createNewHikeAdventureStatement,
  getAdventurePicturesStatement,
  createAdventurePictureStatement,
  deleteBikeStatement,
  getCloseAdventures
} = require('../Statements')
const {
  formatAdventureForGeoJSON,
  getGeneralFields,
  adventureTemplates,
  getStatementKey,
  getPropsToImport,
  parseAdventures,
  createSpecificProperties
} = require('./utils')
const {
  failedInsertion,
  failedQuery,
  failedUpdate,
  failedDeletion,
  calculateCameraBounds
} = require('../utils')
const { removeImage } = require('../../Services/utils/sharp')
const logger = require('../../Config/logger')

// if everything is working right, the only time a cache is out of date is
// when a new adventure gets added or updated and then we update the cache
// const CACHE_TIMEOUT = 60000

class AdventureDataLayer extends DataLayer {
  /**
   * @param {Object} adventure | the adventure object to be added
   * @returns {Promise} the new adventure id
   */
  addAdventure(adventure) {
    const adventureProperties = getPropsToImport(adventure)

    // there are two tables that need to get updated, the specific adventure values, (ski, climb, hike, bike)
    // and the general adventures table. This statement updates the specific one and gets the specific id
    return this.sendQuery(adventureProperties.createNewSpecificStatement, [
      [adventureProperties.specificFields]
    ])
      .then(([{ insertId: specificId }]) =>
        getGeneralFields({
          ...adventure,
          [adventureProperties.specificIdType]: specificId
        })
      )
      .then((fields) => {
        // this is the last query to update the general adventures table and it returns the id of the adventure
        return this.sendQuery(adventureProperties.createNewGeneralStatement, [
          [fields]
        ])
      })
      .then(([{ insertId }]) => insertId)
      .catch(failedInsertion)
  }

  async bulkAddAdventures({ adventures }) {
    const parsedAdventures = parseAdventures(adventures)
    const specificProperties = createSpecificProperties(parsedAdventures)
    const ids = {}
    const generalProperties = {}

    const createNewSpecificStatements = {
      ski: createNewSkiStatement,
      climb: createNewClimbStatement,
      hike: createNewHikeStatement
    }

    const createNewGeneralStatements = {
      ski: createNewSkiAdventureStatement,
      climb: createNewClimbAdventureStatement,
      hike: createNewHikeAdventureStatement
    }

    return Promise.all(
      ['ski', 'climb', 'hike', 'bike'].map((type) => {
        if (!parsedAdventures[type].length) {
          return []
        }

        return this.sendQuery(createNewSpecificStatements[type], [
          specificProperties[type]
        ]).then(([{ insertId }]) => {
          ids[type] = parsedAdventures[type].map((_, idx) => insertId + idx)
          generalProperties[type] = parsedAdventures[type].map(
            (adventure, idx) =>
              getGeneralFields({
                ...adventure,
                [`adventure_${type}_id`]: ids[type][idx]
              })
          )
          return this.sendQuery(createNewGeneralStatements[type], [
            generalProperties[type]
          ]).then(([{ insertId: adventureId }]) => {
            return parsedAdventures[type].map((adventure, idx) => ({
              ...adventure,
              id: adventureId + idx
            }))
          })
        })
      })
    )
  }

  /**
   * @param {Object} params
   * @param {number} params.adventureId
   * @param {string} params.adventureType
   * @returns {Promise<AdventureObject>}
   */
  getAdventure({ adventureId, adventureType }) {
    return this.sendQuery(selectAdventureByIdGroup[adventureType], [
      adventureId
    ])
      .then(([[selectedAdventure]]) => {
        if (!selectedAdventure) {
          return null
        }

        // convert the stringified path back to an object
        if (['ski', 'hike', 'bike'].includes(adventureType)) {
          if (selectedAdventure?.path?.length !== 0) {
            selectedAdventure.path = JSON.parse(selectedAdventure.path)
            selectedAdventure.cameraBounds = calculateCameraBounds(
              selectedAdventure.path
            )
          } else if (!selectedAdventure?.path) {
            selectedAdventure.path = []
          }

          if (selectedAdventure.approach_distance !== undefined) {
            selectedAdventure.distance = selectedAdventure.approach_distance
            delete selectedAdventure.approach_distance
          }
        }

        selectedAdventure.rating = `${Math.round(
          selectedAdventure.rating.split(':')[0]
        )}:${selectedAdventure.rating.split(':')[1]}`

        return selectedAdventure
      })
      .catch(failedQuery)
  }

  /**
   * @param {Object} params
   * @param {string} params.adventureType | 'ski' | 'hike' | 'climb' | 'bike'
   * @param {Object} params.coordinates
   * @param {number} params.coordinates.lat
   * @param {number} params.coordiantes.lng
   * @param {number} params.count
   * @returns {Promise<Object[]>} | returns a promise containing an array of adventure objects that are closest to the given coordinates
   */
  getClosestAdventures({ adventureType, coordinates, count }) {
    logger.info({ centerCoordinatesOfAdventures: coordinates })
    return this.sendQuery(getCloseAdventures[adventureType], [
      coordinates.lat,
      coordinates.lng,
      count
    ])
      .then(([results]) => results)
      .catch(failedQuery)
  }

  /**
   * @param {Object} params
   * @param {string} params.adventureType
   * @returns {Promise<AdventureObject[]>}
   */
  databaseGetTypedAdventures({ adventureType }) {
    // fetch all the adventures that pertain to that type from the database
    return this.sendQuery(selectAdventuresStatement, [adventureType])
      .then(([results]) => {
        return results.map((result) => formatAdventureForGeoJSON(result))
      })
      .then((formattedResults) => {
        // this is formatted as geoJSON because the mapbox api needs to read it
        return {
          type: 'FeatureCollection',
          features: formattedResults
        }
      })
      .catch(failedQuery)
  }

  /**
   * @param {Object} params
   * @param {Object} params.field
   * @param {string} params.field.name
   * @param {string} params.field.value
   * @param {number} params.field.adventure_id
   * @param {string} params.field.adventure_type
   * @returns {Promise<AdventureObject>} the updated adventure
   */
  databaseEditAdventure({ field }) {
    // some of the adventure fields are in the adventures table, some are in the specific-type table
    // if this field is in the general table then we just need to update that one.
    // Editing requires another read because we need to update the searchable statement table as well
    if (adventureTemplates.general.includes(field.name)) {
      return this.sendQuery(updateAdventureStatements[field.name], [
        field.value,
        field.adventure_id
      ])
        .then(() => this.sendQuery(getKeywordsStatement, [field.adventure_id]))
        .then(([[result]]) => result)
        .catch(failedUpdate)
    } else {
      // if we are updating one of the specific adventure fields then we just do that
      return this.sendQuery(
        updateAdventureStatements[
          getStatementKey(field.name, field.adventure_type)
        ],
        [field.value, field.adventure_id]
      )
        .then(() => false)
        .catch(failedUpdate)
    }
  }

  /**
   * @param {Object} params
   * @param {string} params.keyword
   * @param {number} params.adventureId
   * @returns {Promise} void
   */
  updateSearchAdventureKeywords({ keyword, adventureId }) {
    return this.sendQuery(addKeywordStatement, [keyword, adventureId]).catch(
      failedUpdate
    )
  }

  /**
   * @param {Object} params
   * @param {string} params.search
   * @returns {Promise<AdventureObject[]>} a list of adventures matching the given string
   */
  searchDatabaseForAdventureString({ search }) {
    return this.sendQuery(searchAdventureStatement, [`%${search}%`])
      .then(([allResults]) => allResults)
      .catch(failedQuery)
  }

  /**
   * @param {Object} params
   * @param {number} params.adventureId
   * @param {string} params.adventureType
   * @return {Promise} void
   */
  async databaseDeleteAdventure({ adventureId, adventureType }) {
    // to delete an adventure, we have to delete all the pictures for that adventure,
    // then we can delete the adventure and the specific adventure details
    return this.getAdventureImages({ adventureId })
      .then((pictures) => {
        pictures.forEach((picture) => {
          removeImage({ url: picture })
        })
      })
      .then(() => {
        const databaseDeleteAdventureStatement =
          (adventureType === 'ski' && deleteSkiStatement) ||
          (adventureType === 'climb' && deleteClimbStatement) ||
          (adventureType === 'hike' && deleteHikeStatement) ||
          (adventureType === 'bike' && deleteBikeStatement)

        return this.sendQuery(databaseDeleteAdventureStatement, [
          Number(adventureId)
        ])
      })
      .then(([result]) => result)
      .catch(failedDeletion)
  }

  /**
   * @param {Object} params
   * @param {number} params.adventureId
   * @returns {Promise<string[]>} | a list of urls attributed to that adventure
   */
  getAdventureImages({ adventureId }) {
    return this.sendQuery(getAdventurePicturesStatement, [adventureId])
      .then(([results]) =>
        results.map(({ url }) => url.replace('images/', 'images/thumbs/'))
      )
      .catch(failedQuery)
  }

  /**
   * @param {Object} params
   * @param {string} params.url
   * @param {number} params.userId
   * @param {number} params.adventureId
   * @returns {Promise<string>}
   */
  saveImageToAdventure({ url, userId, adventureId }) {
    return this.sendQuery(createAdventurePictureStatement, [
      url,
      userId,
      adventureId
    ])
      .then(([results]) => {
        if (Object.keys(results).length) {
          return 'adventure image saved'
        } else {
          throw 'saving adventure image failed'
        }
      })
      .catch(failedInsertion)
  }
}

module.exports = AdventureDataLayer
