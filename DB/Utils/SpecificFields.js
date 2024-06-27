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
  adventure.elevations ?? '[]',
  adventure.climb ?? 0,
  adventure.descent ?? 0
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
    +adventure.public,
    adventure.rating || '0:0',
    adventure.difficulty || '0:0'
  ]
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
  getSkiApproachSpecificFields,
  getSkiSpecificFields,
  getClimbSpecificFields,
  getHikeSpecificFields,
  getBikeSpecificFields,
  getGeneralFields,
  createSpecificProperties
}
