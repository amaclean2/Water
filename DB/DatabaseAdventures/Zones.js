const DataLayer = require('..')
const logger = require('../../Config/logger')
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
  intersectingZoneQuery,
  deleteZoneQuery,
  getZoneParentQuery
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

  async getZoneParent({ zoneId }) {
    try {
      const [results] = await this.sendQuery(getZoneParentQuery, [zoneId])

      if (results.length) {
        return results[0].parent_id
      } else {
        return null
      }
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
      logger.info(`zone property: ${zoneProperty}`)
      const editQuery = editZoneFieldQueries[zoneProperty]

      const something = await this.sendQuery(editQuery, [zoneValue, zoneId])
      return something
    } catch (error) {
      throw failedUpdate(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number[]} params.adventureIds
   * @param {number} params.zoneId
   * @returns {Promise<void>} nothing useful
   */
  async addAdventureToZone({ adventureIds, zoneId }) {
    try {
      const something = await this.sendQuery(addAdventureToZoneQuery, [
        adventureIds.map((ad) => [ad, zoneId, 'adventure'])
      ])
      return something
    } catch (error) {
      throw failedInsertion(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number[]} params.adventureIds
   * @returns {Promise<void>} nothing useful
   */
  async removeAdventureFromZone({ adventureIds }) {
    try {
      const something = await this.sendQuery(removeAdventureFromZoneQuery, [
        adventureIds.map((id) => [id])
      ])
      return something
    } catch (error) {
      throw failedDeletion(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number[]} params.childZoneIds
   * @param {number} params.parentZoneId
   * @returns {Promise<void>} nothing useful
   */
  async addChildZoneToZone({ childZoneIds, parentZoneId }) {
    try {
      const something = await this.sendQuery(addZoneToZoneQuery, [
        childZoneIds.map((cz) => [cz, parentZoneId, 'zone'])
      ])
      return something
    } catch (error) {
      throw failedInsertion(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number[]} params.childZoneIds
   * @returns {Promise<void>} nothing useful
   */
  async removeChildZoneFromZone({ childZoneIds }) {
    try {
      const something = await this.sendQuery(removeZoneFromZoneQuery, [
        childZoneIds.map((id) => [id])
      ])
      return something
    } catch (error) {
      throw failedDeletion(error)
    }
  }

  async deleteZone({ zoneId }) {
    try {
      await this.sendQuery(deleteZoneInteractionsQuery, [zoneId, zoneId])
      await this.sendQuery(deleteZoneQuery, [zoneId])
      return true
    } catch (error) {
      throw failedDeletion(error)
    }
  }
}

module.exports = ZoneDataLayer
