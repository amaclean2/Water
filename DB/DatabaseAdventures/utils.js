const {
  createNewSkiStatement,
  createNewSkiAdventureStatement,
  createNewClimbStatement,
  createNewClimbAdventureStatement,
  createNewHikeStatement,
  createNewHikeAdventureStatement,
  createNewBikeStatement,
  createNewBikeAdventureStatement
} = require('../Statements')

const sportGrades = [
  '5.2',
  '5.3',
  '5.4',
  '5.5',
  '5.6',
  '5.7',
  '5.8',
  '5.9',
  '5.10a',
  '5.10b',
  '5.10c',
  '5.10d',
  '5.11a',
  '5.11b',
  '5.11c',
  '5.11d',
  '5.12a',
  '5.12b',
  '5.12c',
  '5.12d',
  '5.13a',
  '5.13b',
  '5.13c',
  '5.13d',
  '5.14a',
  '5.14b',
  '5.14c',
  '5.14d',
  '5.15a',
  '5.15b',
  '5.15c',
  '5.15d'
]

const vGrades = [
  'V0',
  'V1',
  'V2',
  'V3',
  'V4',
  'V5',
  'V6',
  'V7',
  'V8',
  'V9',
  'V10',
  'V11',
  'V12',
  'V13',
  'V14',
  'V15',
  'V16'
]

const iceGrades = ['WI-1', 'WI-2', 'WI-3', 'WI-4', 'WI-5', 'WI-6', 'WI-7']

const convertToGrade = (difficulty, climb_type) => {
  difficulty = difficulty.split(':')[0]

  switch (climb_type) {
    case 'boulder':
      return `${vGrades[difficulty - 1]}:${difficulty.split(':')[1]}`
    case 'ice':
      return `${iceGrades[difficulty - 1]}:${difficulty.split(':')[1]}`
    default:
      return `${sportGrades[difficulty - 1]}:${difficulty.split(':')[1]}`
  }
}

const formatAdventureForGeoJSON = (adventure) => {
  const newAdventure = {
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

  delete newAdventure.properties.coordinates_lat
  delete newAdventure.properties.coordinates_lng

  return newAdventure
}

// all properties below must be in order of the database query
const getSkiSpecificFields = (adventure) => [
  adventure.avg_angle || 0,
  adventure.max_angle || 0,
  adventure.approach_distance || '',
  adventure.aspect || 'N',
  adventure.summit_elevation || 0,
  adventure.base_elevation || 0,
  adventure.exposure || 0,
  adventure.gear || '',
  adventure.season || '',
  adventure.trail_path || ''
]

// all properties below must be in order of the database query
const getClimbSpecificFields = (adventure) => [
  adventure.pitches || 0,
  adventure.protection || '',
  adventure.climb_type || '',
  adventure.light_times || '',
  adventure.season || '',
  adventure.approach || '',
  adventure.first_ascent || ''
]

// all properties below must be in order of the database query
const getHikeSpecificFields = (adventure) => [
  adventure.summit_elevation || 0,
  adventure.base_elevation || 0,
  adventure.distance || 0,
  adventure.season || '',
  adventure.trail_path || ''
]

// all properties below must be in order of the database query
const getBikeSpecificFields = (adventure) => [
  adventure.summit_elevation || 0,
  adventure.base_elevation || 0,
  adventure.distance || 0,
  adventure.season || '',
  adventure.trail_path || '',
  adventure.climb || 0,
  adventure.descent || 0
]

const getGeneralFields = (adventure) => {
  return [
    (adventure.adventure_type === 'ski' && adventure.adventure_ski_id) ||
      (adventure.adventure_type === 'climb' && adventure.adventure_climb_id) ||
      (adventure.adventure_type === 'hike' && adventure.adventure_hike_id) ||
      (adventure.adventure_type === 'bike' && adventure.adventure_bike_id),
    adventure.adventure_name,
    adventure.adventure_type,
    adventure.bio || '',
    adventure.coordinates_lat,
    adventure.coordinates_lng,
    adventure.creator_id,
    adventure.nearest_city,
    adventure.public,
    adventure.rating || 0,
    adventure.difficulty || '0:0'
  ]
}

const adventureTemplates = {
  general: [
    'adventure_name',
    'bio',
    'coordinates_lat',
    'coordinates_lng',
    'nearest_city',
    'rating',
    'public',
    'difficulty'
  ],
  ski: [
    'approach_distance',
    'season',
    'avg_angle',
    'max_angle',
    'summit_elevation',
    'gear',
    'base_elevation'
  ],
  climb: [
    'climb_type',
    'protection',
    'pitches',
    'light_times',
    'season',
    'approach',
    'first_ascent'
  ],
  hike: ['season', 'length', 'base_elevaiton', 'summit_elevation'],
  bike: [
    'season',
    'length',
    'base_elevation',
    'summit_elevation',
    'climb',
    'descent'
  ]
}

const getStatementKey = (name, type) => {
  switch (name) {
    case 'difficulty':
      if (type === 'ski') return 'ski_difficulty'
      else if (type === 'bike') return 'bike_difficulty'
      else return 'hike_difficulty'
    case 'summit_elevation':
      if (type === 'ski') return 'ski_summit_elevation'
      else if (type === 'bike') return 'bike_summit_elevation'
      else return 'hike_summit_elevation'
    case 'base_elevation':
      if (type === 'ski') return 'ski_base_elevation'
      else if (type === 'bike') return 'bike_base_elevaiton'
      else return 'hike_base_elevation'
    case 'season':
      if (type === 'ski') return 'ski_season'
      else if (type === 'bike') return 'bike_season'
      else if (type === 'climb') return 'climb_season'
      else return 'hike_season'
    case 'approach':
      return 'climb_approach'
    case 'distance':
      if (type === 'bike') return 'bike_distance'
      return 'hike_distance'
    case 'trail_path':
      if (type === 'ski') return 'ski_trail_path'
      else if (type === 'hike') return 'hike_trail_path'
      return 'bike_trail_path'
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

  return parsedAdventures
}

const createSpecificProperties = (parsedAdventures) => {
  const specificProperties = {}
  specificProperties.ski = parsedAdventures.ski.map((adventure) =>
    getSkiSpecificFields(adventure)
  )
  specificProperties.climb = parsedAdventures.climb.map((adventure) =>
    getClimbSpecificFields(adventure)
  )
  specificProperties.hike = parsedAdventures.hike.map((adventure) =>
    getHikeSpecificFields(adventure)
  )

  specificProperties.bike = parsedAdventures.bike.map((adventure) =>
    getBikeSpecificFields(adventure)
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
  adventureTemplates,
  convertToGrade
}
