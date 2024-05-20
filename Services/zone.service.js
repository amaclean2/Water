const { Cache } = require('memory-cache')

const Water = require('.')
const SearchService = require('./search.service')
const logger = require('../Config/logger')

const CACHE_TIMEOUT = 1000 * 360

class ZoneService extends Water {
  constructor(sendQuery, jwtSecret) {
    super(sendQuery, jwtSecret)
    this.search = new SearchService(sendQuery, jwtSecret)
    this.zoneCache = new Cache()
  }

  /**
   * @typedef {Object} NewZone
   * @property {string} zoneName
   * @property {string} adventureType
   * @property {number} coordinatesLat
   * @property {number} coordinatesLng
   * @property {number} creatorId
   * @property {string} nearestCity
   * @property {number} public
   */

  /**
   * @param {Object} params
   * @param {string} params.adventureType
   * @returns {Promise<Object>} an object containing an array of adventures with the key of the adventure type
   */
  async getAllZonesPerType({ adventureType }) {
    try {
      const cachedZones = this.zoneCache.get(adventureType)

      if (cachedZones)
        return {
          [adventureType]: cachedZones
        }

      const zones = await this.zoneDB.getZonesPerType({ adventureType })

      this.zoneCache.put(adventureType, zones, CACHE_TIMEOUT)

      return { [adventureType]: zones }
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.zoneId
   * @returns {Promise<Object>} an adventure object
   */
  async getZoneData({ zoneId }) {
    // we can support images later
    try {
      const zoneData = {
        ...(await this.zoneDB.getZoneMetadata({ zoneId })),
        adventures: await this.zoneDB.getZoneAdventures({ zoneId }),
        zones: await this.zoneDB.getZoneSubzones({ zoneId }),
        images: []
      }

      return zoneData
    } catch (error) {
      logger.info(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.adventureId
   * @param {number} params.zoneId
   * @returns {Promise<boolean>} true if they match, false otherwise
   */
  async getMatchingAdventures({ adventureId, zoneId }) {
    return await this.zoneDB.getAdventureZoneMatch({ adventureId, zoneId })
  }

  /**
   * @param {Object} params
   * @param {number} params.parentZoneId
   * @param {number} params.childZoneId
   * @returns {Promise<boolean>} true if they match, false otherwise
   */
  async getMatchingZones({ parentZoneId, childZoneId }) {
    return await this.zoneDB.getZoneZoneMatch({ parentZoneId, childZoneId })
  }

  /**
   * @param {Object} params
   * @param {NewZone} params.zoneParams
   * @returns {Promise<NewZone>}
   */
  async createNewZone({ zoneParams }) {
    try {
      const newZone = {
        ...(await this.zoneDB.createZone({ newZone: zoneParams })),
        adventures: [],
        zones: [],
        images: []
      }

      this.zoneCache.clear()

      return newZone
    } catch (error) {
      logger.info(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.zoneId
   * @param {number} params.adventureId
   * @returns {Promise<Object>} an adventure object
   */
  async addAdventure({ zoneId, adventureId }) {
    try {
      await this.zoneDB.addAdventureToZone({
        adventureIds: [adventureId],
        zoneId
      })
      return await this.getZoneData({ zoneId })
    } catch (error) {
      logger.info(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.zoneId
   * @param {number} params.adventureId
   * @returns {Promise<Object>} an adventure object
   */
  async removeAdventure({ adventureId, zoneId }) {
    try {
      await this.zoneDB.removeAdventureFromZone({ adventureIds: [adventureId] })
      return await this.getZoneData({ zoneId })
    } catch (error) {
      logger.info(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.newZoneId
   * @param {number[]} params.adventureIds
   * @returns {Promise<Object>} an adventure object of the new adventure zone
   */
  async moveAdventure({ adventureId, newZoneId }) {
    try {
      await this.zoneDB.removeAdventureFromZone({ adventureIds: [adventureId] })
      await this.zoneDB.addAdventureToZone({
        adventureIds: [adventureId],
        zoneId: newZoneId
      })
      return await this.getZoneData({ zoneId: newZoneId })
    } catch (error) {
      logger.info(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.parentZoneId
   * @param {number} params.childZoneId
   * @returns {Promise<Object>} an adventure object of the new adventure zone
   */
  async addSubzone({ parentZoneId, childZoneId }) {
    try {
      await this.zoneDB.addChildZoneToZone({
        childZoneIds: [childZoneId],
        parentZoneId
      })
      return await this.getZoneData({ parentZoneId })
    } catch (error) {
      logger.info(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.parentZoneId
   * @param {number} params.childZoneId
   * @returns {Promise<Object>} an adventure object of the new adventure zone
   */
  async removeSubzone({ childZoneId, parentZoneId }) {
    try {
      await this.zoneDB.removeChildZoneFromZone({ childZoneIds: [childZoneId] })
      return await this.getZoneData({ parentZoneId })
    } catch (error) {
      logger.info(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.newParentZoneId
   * @param {number} params.childZoneId
   * @returns {Promise<Object>} an adventure object of the new adventure zone
   */
  async moveSubZone({ newParentZoneId, childZoneId }) {
    try {
      await this.zoneDB.removeChildZoneFromZone({ childZoneIds: [childZoneId] })
      await this.zoneDB.addChildZoneToZone({
        childZoneIds: [childZoneId],
        parentZoneId: newParentZoneId
      })
      return await this.getZoneData({ zoneId: newParentZoneId })
    } catch (error) {
      logger.info(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {string} params.editField
   * @param {string | number} params.editValue
   * @param {number} params.editZoneId
   * @returns {Promise<void>} not'in
   */
  async editZone({ editField, editValue, editZoneId }) {
    try {
      await this.zoneDB.editZoneField({
        zoneProperty: editField,
        zoneValue: editValue,
        zoneId: editZoneId
      })
    } catch (error) {
      logger.info(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.zoneId
   * @returns {Promise<Object>} an object containing the zones child adventures and zones if the user wants to do anything with them since this information needed to be fetched anyways
   */
  async deleteZone({ zoneId }) {
    // If the zone has a parent, move all children to the parent otherwise just delete the zone.
    // The relationships will die and the children will be free
    const zoneParent = await this.zoneDB.getZoneParent({ zoneId })
    const childAdventures = await this.zoneDB.getZoneAdventures({ zoneId })
    const childZones = await this.zoneDB.getZoneSubzones({ zoneId })

    if (zoneParent) {
      if (childAdventures.length) {
        await this.zoneDB.removeAdventureFromZone({
          adventureIds: childAdventures.map(({ adventure_id }) => adventure_id)
        })
        await this.zoneDB.addAdventureToZone({
          adventureIds: childAdventures.map(({ adventure_id }) => adventure_id),
          zoneId: zoneParent.id
        })
      }

      if (childZones.length) {
        await this.zoneDB.removeChildZoneFromZone({
          childZoneIds: childZones.map(({ zone_id }) => zone_id)
        })
        await this.zoneDB.addChildZoneToZone({
          childZoneIds: childZones.map(({ zone_id }) => zone_id),
          parentZoneId: zoneParent.id
        })
      }
    }

    await this.zoneDB.deleteZone({ zoneId })
    this.zoneCache.clear()

    return {
      child_adventures: childAdventures,
      child_zones: childZones
    }
  }
}

module.exports = ZoneService
