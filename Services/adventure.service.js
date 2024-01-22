const Water = require('.')
const SearchService = require('./search.service')
const { Cache } = require('memory-cache')
const { updateAdventureCache } = require('./utils/caching')
const csv = require('csvtojson')
const logger = require('../Config/logger')

const CACHE_TIMEOUT = 1000 * 360

/**
 * @class
 * @param {function} sendQuery | function to make a database call
 * @param {string} jwtSecret | secret used for JsonWebToken
 */
class AdventureService extends Water {
  constructor(sendQuery, jwtSecret) {
    super(sendQuery, jwtSecret)
    this.search = new SearchService(sendQuery, jwtSecret)
    this.adventureCache = new Cache()
  }
  /**
   * @private
   * @param {Object} params
   * @param {number} params.id
   * @param {string} params.type
   * @param {Object} params.availableFields
   * @param {AdventureObject} [params.providedObject] | if we don't want to call the database, we can fill in the adventure with this
   * @returns {Promise<AdventureObject>} an adventure object
   */
  async #buildAdventureObject({ id, type, providedObject }) {
    if (providedObject) {
      const basicAdventure = {
        ...providedObject,
        id,
        todo_users: [],
        completed_users: [],
        images: [],
        coordinates: {
          lat: providedObject.coordinates_lat,
          lng: providedObject.coordinates_lng
        }
      }

      return basicAdventure
    }

    const adventure = await this.adventureDB.getAdventure({
      adventureId: id,
      adventureType: type
    })

    if (!adventure) {
      throw "adventure couldn't be found"
    }

    const todoUsers = await this.todoDB.getAdventureTodoList({
      adventureId: id
    })
    const completedUsers = await this.completedDB.getCompletedUsers({
      adventureId: id
    })
    const images = await this.adventureDB.getAdventureImages({
      adventureId: id
    })

    const formattedAdventure = {
      ...adventure,
      images,
      todo_users: todoUsers,
      completed_users: completedUsers,
      public: !!adventure.public,
      coordinates: {
        lat: adventure.coordinates_lat,
        lng: adventure.coordinates_lng
      }
    }

    delete formattedAdventure.coordinates_lat
    delete formattedAdventure.coordinates_lng

    return formattedAdventure
  }

  /**
   * @typedef {Object} CreateAdventureResponse
   * @property {AdventureObject} adventure
   * @property {AdventureGeoJsonObject} adventureList
   */

  /**
   * @param {Object} params
   * @param {AdventureObject} params.adventureObject | an object containing something...
   * @returns {Promise<CreateAdventureResponse>} | an object containing the adventure and the geojson list
   */
  async createAdventure({ adventureObject }) {
    const adventureId = await this.adventureDB.addAdventure(adventureObject)
    const adventure = await this.#buildAdventureObject({
      id: adventureId,
      type: adventureObject.adventure_type,
      providedObject: adventureObject
    })

    // we need to rebuild the cached adventure list. Since we can do this with data we already have,
    // it doesn't require another round trip to the database
    const updatedCacheObject = updateAdventureCache({
      cacheObject: {
        ...this.adventureCache.get(adventureObject.adventure_type)
      },
      adventureObject: { ...adventureObject, id: adventureId }
    })

    this.adventureCache.put(
      adventureObject.adventure_type,
      updatedCacheObject,
      CACHE_TIMEOUT
    )

    this.search.saveAdventureKeywords({
      searchableFields: adventure,
      id: adventure.id
    })

    return { adventure, adventureList: updatedCacheObject }
  }

  /**
   * @param {Object} params
   * @param {AdventureObject[]} params.adventures
   * @returns {Promise<void>} | there's too much stuff to return
   */
  bulkAdventureCreation({ adventures }) {
    return this.adventureDB
      .bulkAddAdventures({ adventures })
      .then((response) => {
        const allAdventures = response.reduce(
          (adventureList, adventureType) => [
            ...adventureList,
            ...adventureType
          ],
          []
        )

        for (const adventure in allAdventures) {
          this.search.saveAdventureKeywords({
            searchableFields: allAdventures[adventure],
            id: allAdventures[adventure].id
          })
        }

        this.adventureCache.clear()
        return allAdventures
      })
  }

  /**
   * @param {Object} params
   * @param {string} params.adventureType | the adventure type to get
   * @returns {Promise<AdventureGeoJsonObject>} a list of adventures formatted as geoJson
   */
  getAdventureList({ adventureType }) {
    // if there is already a cached adventure list, just return that
    const cachedResults = this.adventureCache.get(adventureType)

    if (cachedResults) {
      return cachedResults
    }

    return this.adventureDB
      .databaseGetTypedAdventures({ adventureType })
      .then((adventures) => {
        this.adventureCache.put(adventureType, adventures, CACHE_TIMEOUT)
        return adventures
      })
  }

  /**
   * @param {Object} params
   * @param {string} params.search | the search string to use against the users list
   * @returns {Promise<AdventureObject[]>} a list of adventures
   */
  searchForAdventures({ search }) {
    if (!search?.length) return []

    return this.search.handleAdventureSearch({ search })
  }

  /**
   * @param {Object} params
   * @param {string} params.adventureType
   * @param {Object} params.coordinates
   * @param {number} params.coordinates.lat
   * @param {number} params.coordinates.lng
   * @param {number} params.count
   * @returns {Promise<Object[]>} a list of adventures ordered from closest to the given coordinates within the count limit provided
   */
  getClosestAdventures({ adventureType, coordinates, count = 10 }) {
    if (!(adventureType && coordinates.lat && coordinates.lng)) {
      throw 'adventureType and coordinates are required'
    }

    if (
      typeof adventureType !== 'string' ||
      typeof coordinates.lat !== 'number' ||
      typeof coordinates.lng !== 'number' ||
      (count && typeof count !== 'number')
    ) {
      throw 'adventureType must be a string. Coordinates must be numbers and count must be a number'
    }

    return this.adventureDB.getClosestAdventures({
      adventureType,
      coordinates,
      count
    })
  }

  /**
   * @param {Object} params
   * @param {number} params.adventureId | the id of the adventure to search for
   * @param {string} params.adventureType | the type of the adventure to search for
   * @returns {Promise<AdventureObject>}
   */
  getSpecificAdventure({ adventureId, adventureType }) {
    if (!adventureId || !adventureType) {
      throw 'The adventureId and adventureType fields are required to be non-falsy. Please supply the missing field(s).'
    }
    return this.#buildAdventureObject({ id: adventureId, type: adventureType })
  }

  /**
   * @param {Object} params
   * @param {number} params.adventureId
   * @param {string} params.difficulty
   * @param {string} params.rating
   * @returns {Promise<{match: boolean, response: string}>}
   */
  checkAdventureRatings({ adventureId, difficulty, rating }) {
    return this.completedDB
      .getAdventureRatings({ adventureId })
      .then((ratings) => {
        const { difficulty: dbDifficulty, rating: dbRating } = ratings

        const [newDifficulty, oldDifficulty, tally] = difficulty.split(':')
        const [newRating, oldRating, ratingTally] = rating.split(':')

        if (`${oldDifficulty}:${tally}` !== dbDifficulty) {
          return {
            match: false,
            response: `Difficulty does not match. Difficulty of adventure is ${dbDifficulty}`
          }
        } else if (`${oldRating}:${ratingTally}` !== dbRating) {
          return {
            match: false,
            response: `Rating does not match. Rating of adventure is ${dbRating}`
          }
        } else {
          return { match: true, response: '' }
        }
      })
  }

  convertMetersToFeet(meters) {
    return meters * 3.28084
  }

  async databaseEditPath({ field }) {
    try {
      const elevations = JSON.parse(field.elevations)
      const sortedElevations = elevations
        .map((elev) => elev[0])
        .sort((a, b) => a - b)
      const highest =
        Math.round(
          this.convertMetersToFeet(sortedElevations.slice(-1)[0]) * 1000
        ) / 1000
      const lowest =
        Math.round(this.convertMetersToFeet(sortedElevations[0]) * 1000) / 1000

      let lastElevation = elevations[0][0]
      let totals = [0, 0]
      elevations.forEach((elev) => {
        if (elev[0] - lastElevation > 0) {
          totals[0] = elev[0] - lastElevation + totals[0]
        } else {
          totals[1] = elev[0] - lastElevation + totals[1]
        }

        lastElevation = elev[0]
      })

      logger.info(
        `database path edit: ${totals}, highest: ${highest}, lowest: ${lowest}`
      )

      if (field.adventure_type === 'bike') {
        await this.adventureDB.databaseEditAdventurePaths({
          field: {
            ...field,
            summit_elevation: highest,
            base_elevation: lowest,
            climb: this.convertMetersToFeet(totals[0]),
            descent: this.convertMetersToFeet(-1 * totals[1])
          }
        })
      } else {
        await this.adventureDB.databaseEditAdventurePaths({
          field: {
            ...field,
            summit_elevation: highest,
            base_elevation: lowest
          }
        })
      }

      logger.info(`database update finished on ${field.adventure_id}`)

      return {
        field,
        summit_elevation: highest,
        base_elevation: lowest,
        climb: totals[0],
        descent: totals[1]
      }
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {Object} params.field | the field to update
   * @param {string} params.field.name | the name of the field to update
   * @param {string} params.field.value | the value of the field to update
   * @param {number} params.field.adventure_id | the id of the adventure to update
   * @param {string} params.field.adventure_type | the type of the adventure to update
   * @param {string} params.field.path | if a path field is being updated
   * @param {string} params.field.elevations | if a path field is being updated elevations should also be provided
   * @return {Promise<void>}
   */
  async editAdventure({ field }) {
    try {
      if (field.path) {
        if (field.path === '[]') {
          await this.adventureDB.databaseEditAdventurePaths({
            field: { ...field, action: 'remove' }
          })

          return field
        }

        return await this.databaseEditPath({ field })
      } else {
        const adventureKeywords = await this.adventureDB.databaseEditAdventure({
          field
        })

        if (
          adventureKeywords !== false &&
          this.search.adventureKeywordLibrary.includes(field.name)
        ) {
          this.adventureCache.del(adventureKeywords.adventure_type)
          await this.search.saveAdventureKeywords({
            searchableFields: adventureKeywords,
            adventureId: field.adventure_id
          })
        }

        logger.info(`database update finished on ${field.adventure_id}`)

        return field
      }
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.adventureId | the id of the adventure to delete
   * @param {string} params.adventureType | the type of the adventure to delete
   * @returns {Promise<DeletionResponse>} | an object containing affectedRows
   */
  deleteAdventure({ adventureId, adventureType }) {
    return this.adventureDB
      .databaseDeleteAdventure({
        adventureId,
        adventureType
      })
      .then((resp) => {
        this.adventureCache.del(adventureType)
        return resp
      })
  }

  /**
   * @param {Object} params
   * @param {string} csvString
   * @returns {Object} a JSON object of all the adventures
   */
  processCSVToAdventure({ csvString }) {
    if (!csvString.length) throw 'There was no data to process'

    return csv()
      .fromString(csvString)
      .then((jsonObject) => {
        jsonObject.forEach((adventure) => {
          if (!adventure.adventure_type)
            throw 'adventure_type is required in the csv file'
          if (!adventure.adventure_name)
            throw 'adventure_name is required in the csv file'
          if (!adventure.coordinates)
            throw 'coordinates are required in the csv file formatted as { lat: number, lng: number }'
          if (!adventure.nearest_city)
            throw 'nearest_city is required in the csv file'
          if (adventure.public === undefined)
            throw 'public is required in the csv file'
        })

        return jsonObject.map((adventure) => ({
          ...adventure,
          public: ['true', 'TRUE', true].includes(adventure.public),
          coordinates: {
            lat: Number(adventure.coordinates.lat),
            lng: Number(adventure.coordinates.lng)
          },
          rating: Number(adventure.rating)
        }))
      })
  }
}

module.exports = AdventureService
