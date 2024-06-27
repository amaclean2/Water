const logger = require('../../Config/logger')
const {
  createNewSkiStatement,
  createNewSkiAdventureStatement,
  createNewClimbStatement,
  createNewClimbAdventureStatement,
  createNewHikeStatement,
  createNewHikeAdventureStatement,
  createNewBikeStatement,
  createNewBikeAdventureStatement,
  createNewSkiApproachStatement,
  createNewApproachStatement
} = require('../Statements')
const {
  getSkiSpecificFields,
  getClimbSpecificFields,
  getHikeSpecificFields,
  getBikeSpecificFields,
  getSkiApproachSpecificFields
} = require('./SpecificFields')

/**
 * @param {string} pathStr
 * @returns {Array.<Array>} | an array, the first element is the path, the second element is the edit points
 */
const splitPath = (pathStr = '[]') => {
  // splitting the array around a point that's [0]. This point is there to split the
  // path shown on the map with the points used to edit the path
  let newPath, newPoints

  let pathArr = null
  if (typeof pathStr === 'string' && pathStr.length > 0) {
    pathArr = JSON.parse(pathStr)
  } else {
    logger.info(`unexpected pathStr: ${pathStr}`)
    pathArr = pathStr
  }

  if (!pathArr) return []

  const splitIdx = pathArr?.findIndex((e) => e.length === 1)
  if (splitIdx !== -1) {
    newPath = pathArr.slice(0, splitIdx)
    newPoints = pathArr.slice(splitIdx + 1)
  } else {
    newPath = pathArr
    newPoints = []
  }

  return [
    newPath.map(([lng, lat]) => [
      parseFloat(lng.toFixed(6)),
      parseFloat(lat.toFixed(6))
    ]),
    newPoints.map(([lng, lat]) => [
      parseFloat(lng.toFixed(6)),
      parseFloat(lat.toFixed(6))
    ])
  ]
}

const removeUnusedVariables = (adventure) => {
  switch (adventure.adventure_type) {
    case 'ski':
      adventure.path = splitPath(adventure.ski_path)[0]
      break
    case 'hike':
      adventure.path = splitPath(adventure.hike_path)[0]
      break
    case 'bike':
      adventure.path = splitPath(adventure.bike_path)[0]
      break
    case 'skiApproach':
      adventure.path = splitPath(adventure.ski_approach_path)[0]
      break
  }

  delete adventure.ski_path
  delete adventure.hike_path
  delete adventure.bike_path
  delete adventure.ski_approach_path

  return adventure
}

const adventurePathColor = (adventureType = 'ski') => {
  const colors = {
    ski: '#38e',
    hike: '#e53',
    climb: '#ccc',
    bike: '#3a3',
    skiApproach: '#d70'
  }

  return colors[adventureType]
}

const getPropsToImport = (adventure) => {
  const { adventure_type } = adventure
  const adventureProperties = {}

  switch (adventure_type) {
    case 'ski':
      adventureProperties.createNewSpecificStatement = createNewSkiStatement
      adventureProperties.createNewGeneralStatement =
        createNewSkiAdventureStatement
      adventureProperties.specificFields = getSkiSpecificFields(adventure)
      adventureProperties.specificIdType = 'adventure_ski_id'
      break
    case 'climb':
      adventureProperties.createNewSpecificStatement = createNewClimbStatement
      adventureProperties.createNewGeneralStatement =
        createNewClimbAdventureStatement
      adventureProperties.specificFields = getClimbSpecificFields(adventure)
      adventureProperties.specificIdType = 'adventure_climb_id'
      break
    case 'hike':
      adventureProperties.createNewSpecificStatement = createNewHikeStatement
      adventureProperties.createNewGeneralStatement =
        createNewHikeAdventureStatement
      adventureProperties.specificFields = getHikeSpecificFields(adventure)
      adventureProperties.specificIdType = 'adventure_hike_id'
      break
    case 'bike':
      adventureProperties.createNewSpecificStatement = createNewBikeStatement
      adventureProperties.createNewGeneralStatement =
        createNewBikeAdventureStatement
      adventureProperties.specificFields = getBikeSpecificFields(adventure)
      adventureProperties.specificIdType = 'adventure_bike_id'
      break
    case 'skiApproach':
      adventureProperties.createNewSpecificStatement =
        createNewApproachStatement
      adventureProperties.createNewGeneralStatement =
        createNewSkiApproachStatement
      adventureProperties.specificFields =
        getSkiApproachSpecificFields(adventure)
      adventureProperties.specificIdType = 'ski_approach_id'
      break
  }

  return adventureProperties
}

const parseAdventures = (adventures) => {
  const parsedAdventures = {}
  parsedAdventures.ski = adventures.filter(
    ({ adventure_type }) => adventure_type === 'ski'
  )
  parsedAdventures.climb = adventures.filter(
    ({ adventure_type }) => adventure_type === 'climb'
  )
  parsedAdventures.hike = adventures.filter(
    ({ adventure_type }) => adventure_type === 'hike'
  )
  parsedAdventures.bike = adventures.filter(
    ({ adventure_type }) => adventure_type === 'bike'
  )
  parsedAdventures.skiApproach = adventures.filter(
    ({ adventure_type }) => adventure_type === 'skiApproach'
  )

  return parsedAdventures
}

const pathAdventures = ['ski', 'hike', 'bike', 'skiApproach']

const adventureTemplate = [
  'adventure_name',
  'bio',
  'coordinates_lat',
  'coordinates_lng',
  'nearest_city',
  'rating',
  'public',
  'difficulty'
]

module.exports = {
  getPropsToImport,
  parseAdventures,
  removeUnusedVariables,
  splitPath,
  adventurePathColor,
  adventureTemplate,
  pathAdventures
}