const DataLayer = require('..')
const {
  getZoneInformationQuery,
  getZoneAdventuresQuery,
  getZoneSubzoneQuery,
  getAllZonesOfATypeQuery,
  createZoneQuery,
  addAdventureToZoneQuery,
  removeAdventureFromZoneQuery,
  addZoneToZoneQuery,
  removeZoneFromZoneQuery,
  editZoneFieldQueries,
  intersectingAdventureQuery,
  intersectingZoneQuery
} = require('../Statements/Zones')
const {
  failedQuery,
  failedInsertion,
  failedUpdate,
  failedDeletion
} = require('../utils')

class ZoneDataLayer extends DataLayer {
  /**
   * @param {Object} params
   * @param {number} params.zoneId
   * @returns {Promise<Object>} an object containing the zone meta information
   */
  async getZoneMetadata({ zoneId }) {
    try {
      const [[zoneData]] = await this.sendQuery(getZoneInformationQuery, [
        zoneId
      ])
      return zoneData
    } catch (error) {
      throw failedQuery(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.zoneId
   * @returns {Promise<Object[]>} an array of adventures that belong to the zone
   */
  async getZoneAdventures({ zoneId }) {
    try {
      const [zoneAdventures] = await this.sendQuery(getZoneAdventuresQuery, [
        zoneId
      ])
      return zoneAdventures
    } catch (error) {
      throw failedQuery(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.zoneId
   * @returns {Promise<Object[]>} an array of subzones that belong to the zone
   */
  async getZoneSubzones({ zoneId }) {
    try {
      const [zoneSubzones] = await this.sendQuery(getZoneSubzoneQuery, [zoneId])
      return zoneSubzones
    } catch (error) {
      throw failedQuery(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.adventureType
   * @returns {Promise<Object[]>} an array of zones that belong to an adventureType
   */
  async getZonesPerType({ adventureType }) {
    try {
      const [zonesPerType] = await this.sendQuery(getAllZonesOfATypeQuery, [
        adventureType
      ])

      logger.info(`${zonesPerType.length} zones returned`)

      return zonesPerType
    } catch (error) {
      throw failedQuery(error)
    }
  }

  async getAdventureZoneMatch({ adventureId, zoneId }) {
    try {
      const [[results]] = await this.sendQuery(intersectingAdventureQuery, [
        adventureId,
        zoneId
      ])

      logger.info(
        `adventure type is ${results.adventure_type} and zone type is ${results.zone_adventure_type}`
      )

      // ski approach adventures can go in the ski zone
      return (
        results.zone_adventure_type === results.adventure_type ||
        (results.zone_adventure_type === 'ski' &&
          results.adventure_type === 'skiApproach')
      )
    } catch (error) {
      throw failedQuery(error)
    }
  }

  async getZoneZoneMatch({ parentZoneId, childZoneId }) {
    try {
      const [results] = await this.sendQuery(intersectingZoneQuery, [
        parentZoneId,
        childZoneId
      ])

      logger.info(
        `the results of the zone match query have length ${results.length}`
      )

      return results.length === 1
    } catch (error) {
      throw failedQuery(error)
    }
  }

  /**
   * @param {Object} params
   * @param {Object} params.newZone
   * @returns {Promise<Object[]>} a new zone
   */
  async createZone({ newZone }) {
    try {
      const {
        zoneName,
        adventureType,
        coordinatesLat,
        coordinatesLng,
        creatorId,
        nearestCity,
        public: isPublic
      } = newZone

      const queryParams = {
        zoneName,
        adventureType,
        coordinatesLat,
        coordinatesLng,
        creatorId,
        nearestCity,
        isPublic
      }

      for (let param in queryParams) {
        if (queryParams[param] === undefined) {
          throw `${param} required to create a new zone. ${queryParams[param]} supplied`
        }
      }

      const [{ insertId }] = await this.sendQuery(createZoneQuery, [
        [Object.values(queryParams)]
      ])

      return { ...newZone, id: insertId }
    } catch (error) {
      throw failedInsertion(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.zoneProperty
   * @param {number} params.zoneValue
   * @param {number} params.zoneId
   * @returns {Promise<void>} nothing useful
   */
  async editZoneField({ zoneProperty, zoneValue, zoneId }) {
    try {
      const editQuery = editZoneFieldQueries[zoneProperty]

      const something = await this.sendQuery(editQuery, [zoneValue, zoneId])
      return something
    } catch (error) {
      throw failedUpdate(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.adventureId
   * @param {number} params.zoneId
   * @returns {Promise<void>} nothing useful
   */
  async addAdventureToZone({ adventureId, zoneId }) {
    try {
      const something = await this.sendQuery(addAdventureToZoneQuery, [
        [[adventureId, zoneId, 'adventure']]
      ])
      return something
    } catch (error) {
      throw failedInsertion(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.adventureId
   * @returns {Promise<void>} nothing useful
   */
  async removeAdventureFromZone({ adventureId }) {
    try {
      const something = await this.sendQuery(removeAdventureFromZoneQuery, [
        adventureId
      ])
      return something
    } catch (error) {
      throw failedDeletion(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.childZoneId
   * @param {number} params.parentZoneId
   * @returns {Promise<void>} nothing useful
   */
  async addChildZoneToZone({ childZoneId, parentZoneId }) {
    try {
      const something = await this.sendQuery(addZoneToZoneQuery, [
        [[childZoneId, parentZoneId, 'zone']]
      ])
      return something
    } catch (error) {
      throw failedInsertion(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.childZoneId
   * @returns {Promise<void>} nothing useful
   */
  async removeChildZoneFromZone({ childZoneId }) {
    try {
      const something = await this.sendQuery(removeZoneFromZoneQuery, [
        childZoneId
      ])
      return something
    } catch (error) {
      throw failedDeletion(error)
    }
  }

  async deleteZone({ zoneId }) {
    console.log(
      "This is dangerous if not done right. I'm not going to implement this right now"
    )
    return false
  }
}

module.exports = ZoneDataLayer
