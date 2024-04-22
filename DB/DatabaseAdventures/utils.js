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

const formatAdventureForGeoJSON = (adventure) => {
  let newAdventure
  if (adventure.adventure_type === 'skiApproach') {
    newAdventure = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: JSON.parse(adventure.trail_path ?? '[]')
      },
      properties: {
        adventure_name: adventure.adventure_name,
        adventure_type: 'skiApproach',
        id: adventure.id,
        public: !!adventure.public
      }
    }
  } else {
    newAdventure = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [adventure.coordinates_lng, adventure.coordinates_lat]
      },
      properties: {
        adventure_name: adventure.adventure_name,
        adventure_type: adventure.adventure_type,
        id: adventure.id,
        public: !!adventure.public
      }
    }
  }

  delete newAdventure.properties.coordinates_lat
  delete newAdventure.properties.coordinates_lng

  return newAdventure
}

// all properties below must be in order of the database query
const getSkiSpecificFields = (adventure) => [
  adventure.avg_angle ?? 0,
  adventure.max_angle ?? 0,
  adventure.aspect ?? 'N',
  adventure.summit_elevation ?? 0,
  adventure.base_elevation ?? 0,
  adventure.exposure ?? 0,
  adventure.season ?? '',
  adventure.trail_path ?? '[]',
  adventure.elevations ?? '[]'
]

// all properties below must be in order of the database query
const getClimbSpecificFields = (adventure) => [
  adventure.pitches ?? 0,
  adventure.protection ?? '',
  adventure.climb_type ?? '',
  adventure.light_times ?? '',
  adventure.season ?? '',
  adventure.approach ?? '',
  adventure.first_ascent ?? ''
]

// all properties below must be in order of the database query
const getHikeSpecificFields = (adventure) => [
  adventure.summit_elevation ?? 0,
  adventure.base_elevation ?? 0,
  adventure.season ?? '',
  adventure.trail_path ?? '[]',
  adventure.elevations ?? '[]'
]

// all properties below must be in order of the database query
const getBikeSpecificFields = (adventure) => [
  adventure.summit_elevation ?? 0,
  adventure.base_elevation ?? 0,
  adventure.season ?? '',
  adventure.trail_path ?? '[]',
  adventure.elevations ?? '[]',
  adventure.climb ?? 0,
  adventure.descent ?? 0
]

const getSkiApproachSpecificFields = (adventure) => [
  adventure.summit_elevation ?? 0,
  adventure.base_elevation ?? 0,
  adventure.gear ?? '',
  adventure.trail_path ?? '[]',
  adventure.elevations ?? '[]',
  adventure.exposure ?? 0
]

const getGeneralFields = (adventure) => {
  return [
    (adventure.adventure_type === 'ski' && adventure.adventure_ski_id) ||
      (adventure.adventure_type === 'climb' && adventure.adventure_climb_id) ||
      (adventure.adventure_type === 'hike' && adventure.adventure_hike_id) ||
      (adventure.adventure_type === 'bike' && adventure.adventure_bike_id) ||
      (adventure.adventure_type === 'skiApproach' && adventure.ski_approach_id),
    adventure.adventure_name,
    adventure.adventure_type,
    adventure.bio || '',
    adventure.coordinates_lat,
    adventure.coordinates_lng,
    adventure.creator_id,
    adventure.nearest_city,
    adventure.public,
    adventure.rating || '0:0',
    adventure.difficulty || '0:0'
  ]
}

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

const getStatementKey = (name, type) => {
  switch (name) {
    case 'summit_elevation':
      if (type === 'ski') return 'ski_summit_elevation'
      else if (type === 'bike') return 'bike_summit_elevation'
      else if (type === 'skiApproach') return 'ski_approach_summit_elevation'
      else return 'hike_summit_elevation'
    case 'base_elevation':
      if (type === 'ski') return 'ski_base_elevation'
      else if (type === 'bike') return 'bike_base_elevaiton'
      else if (type === 'skiApproach') return 'ski_approach_base_elevation'
      else return 'hike_base_elevation'
    case 'season':
      if (type === 'ski') return 'ski_season'
      else if (type === 'bike') return 'bike_season'
      else if (type === 'climb') return 'climb_season'
      else return 'hike_season'
    case 'approach':
      return 'climb_approach'
    case 'trail_path':
      if (type === 'ski') return 'ski_trail_path'
      else if (type === 'hike') return 'hike_trail_path'
      else if (type === 'skiApproach') return 'ski_approach_trail_path'
      return 'bike_trail_path'
    case 'exposure':
      if (type === 'ski') return 'ski_exposure'
      return 'approach_exposure'
    default:
      return name
  }
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

const createSpecificProperties = (parsedAdventures) => {
  const specificProperties = {}
  specificProperties.ski = parsedAdventures.ski.map(getSkiSpecificFields)
  specificProperties.climb = parsedAdventures.climb.map(getClimbSpecificFields)
  specificProperties.hike = parsedAdventures.hike.map(getHikeSpecificFields)
  specificProperties.bike = parsedAdventures.bike.map(getBikeSpecificFields)
  specificProperties.skiApproach = parsedAdventures.skiApproach.map(
    getSkiApproachSpecificFields
  )

  return specificProperties
}

module.exports = {
  formatAdventureForGeoJSON,
  getSkiSpecificFields,
  getClimbSpecificFields,
  getHikeSpecificFields,
  getBikeSpecificFields,
  getGeneralFields,
  getStatementKey,
  getPropsToImport,
  parseAdventures,
  createSpecificProperties,
  adventureTemplate
}
