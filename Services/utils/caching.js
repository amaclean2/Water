const logger = require('../../Config/logger')
const {
  formatAdventureForGeoJSON
} = require('../../DB/DatabaseAdventures/utils')

const updateAdventureCache = ({ cacheObject, adventureObject }) => {
  logger.info('saving new adventure to the adventure list cache')

  if (Object.keys(cacheObject).length) {
    cacheObject.features = [
      ...cacheObject.features,
      formatAdventureForGeoJSON(adventureObject)
    ]
  } else {
    cacheObject.type = 'FeatureCollection'
    cacheObject.features = [formatAdventureForGeoJSON(adventureObject)]
  }

  return cacheObject
}

module.exports = {
  updateAdventureCache
}
