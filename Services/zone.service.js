const { Cache } = require('memory-cache')

const Water = require('.')
const logger = require('../Config/logger')

const CACHE_TIMEOUT = 1000 * 360

class ZoneService extends Water {
  constructor(sendQuery, jwtSecret) {
    super(sendQuery, jwtSecret)
    this.search = new SearchService(sendQuery, jwtSecret)
    this.zoneCache = new Cache()
  }

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

      const zones = this.zoneDB.getZonesPerType({ adventureType })

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
   * @param {number} params.zoneId
   * @param {number} params.adventureId
   * @returns {Promise<Object>} an adventure object
   */
  async addAdventure({ zoneId, adventureId }) {
    try {
      await this.zoneDB.addAdventureToZone({ adventureId, zoneId })
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
      await this.zoneDB.removeAdventureFromZone({ adventureId })
      return await this.getZoneData({ zoneId })
    } catch (error) {
      logger.info(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.newZoneId
   * @param {number} params.adventureId
   * @returns {Promise<Object>} an adventure object of the new adventure zone
   */
  async moveAdventure({ adventureId, newZoneId }) {
    try {
      await this.zoneDB.removeAdventureFromZone({ adventureId })
      await this.zoneDB.addAdventureToZone({ adventureId, zoneId: newZoneId })
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
      await this.zoneDB.addChildZoneToZone({ childZoneId, parentZoneId })
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
      await this.zoneDB.removeChildZoneFromZone({ childZoneId })
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
      await this.zoneDB.removeChildZoneFromZone({ childZoneId })
      await this.zoneDB.addChildZoneToZone({
        childZoneId,
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

  async deleteZone({ zoneId }) {
    console.log('Not yet set up to delete zones')
    return false
  }
}

module.exports = ZoneService
