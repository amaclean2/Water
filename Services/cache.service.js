const { Cache } = require('memory-cache')

const CACHE_TIMEOUT = 1000 * 360

class CacheService {
  constructor() {
    this.zoneCache = new Cache()
    this.adventureCache = new Cache()
  }

  clearZoneCache() {
    this.zoneCache.clear()
  }

  clearAdventureCache() {
    this.adventureCache.clear()
  }

  clearAllCaches() {
    this.zoneCache.clear()
    this.adventureCache.clear()
  }

  /**
   * @param {Object | string | number} data
   * @param {string} property
   */
  addToZoneCache(data, property) {
    this.zoneCache.put(property, data, CACHE_TIMEOUT)
  }

  /**
   * @param {Object | string | number} data
   * @param {string} property
   */
  addToAdventureCache(data, property) {
    this.adventureCache.put(property, data, CACHE_TIMEOUT)
  }

  /**
   * @param {string} property
   */
  removeFromZoneCache(property) {
    this.zoneCache.del(property)
  }

  /**
   * @param {string} property
   */
  removeFromAdventureCache(property) {
    this.adventureCache.del(property)
  }

  /**
   * @param {string} property
   * @returns {Array} | an array of adventures formatted as geojson
   */
  getAdventures(property) {
    return this.adventureCache.get(property)
  }

  /**
   * @param {string} property
   * @returns | an array of zones formatted as geojson
   */
  getZones(property) {
    return this.zoneCache.get(property)
  }
}

module.exports = CacheService
