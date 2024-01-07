const logger = require('../Config/logger')

const failedInsertion = async (error) => {
  logger.error('DATABASE_INSERTION_FAILED')
  logger.error(error)
  throw error
}

const failedQuery = async (error) => {
  logger.error('DATABASE_QUERY_FAILED')
  logger.error(error)
  throw error
}

const failedUpdate = async (error) => {
  logger.error('DATABASE_UPDATE_FAILED')
  logger.error(error)
  throw error
}

const failedDeletion = async (error) => {
  logger.info('DATABASE_DELETION_FAILED')
  logger.error(error)
  throw error
}

/**
 * @param {number[][]} cameraBounds
 * @returns {ne: number[], sw: number[]}
 */
const calculateCameraBounds = (cameraBounds) => {
  const mapBounds = cameraBounds.reduce(
    (bounds, currentCoords) => {
      const [currLng, currLat] = currentCoords
      if (!bounds[0].length) {
        return [currentCoords, currentCoords]
      } else {
        let newLngs = []
        if (currLng > bounds[0][0]) {
          newLngs = [currLng, bounds[1][0]]
        } else if (currLng < bounds[1][0]) {
          newLngs = [bounds[0][0], currLng]
        } else {
          newLngs = [bounds[0][0], bounds[1][0]]
        }

        let newLats = []
        if (currLat > bounds[0][1]) {
          newLats = [currLat, bounds[1][1]]
        } else if (currLat < bounds[1][1]) {
          newLats = [bounds[0][1], currLat]
        } else {
          newLats = [bounds[0][1], bounds[1][1]]
        }

        return [
          [newLngs[0], newLats[0]],
          [newLngs[1], newLats[1]]
        ]
      }
    },
    [[], []]
  )

  return { ne: mapBounds[0], sw: mapBounds[1] }
}

module.exports = {
  failedInsertion,
  failedQuery,
  failedUpdate,
  failedDeletion,
  calculateCameraBounds
}
