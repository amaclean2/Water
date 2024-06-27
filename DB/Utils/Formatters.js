const { adventurePathColor, removeUnusedVariables } = require('.')

const formatAdventureForGeoJSON = (adventures) => {
  const pointAdventures = []
  const lineAdventures = []

  for (let adventure of adventures) {
    if (
      [undefined, null].includes(adventure.path) ||
      adventure.path.length === 0
    ) {
      pointAdventures.push(adventure)
    } else {
      lineAdventures.push(adventure)
    }
  }

  return {
    points: {
      type: 'FeatureCollection',
      features: pointAdventures.map((point) => ({
        type: 'Feature',
        id: point.adventure_id,
        properties: {
          adventureType: point.adventure_type,
          adventureName: point.adventure_name,
          color: adventurePathColor(point.adventure_type)
        },
        geometry: {
          type: 'Point',
          coordinates: formatCoordsGeo(
            point.coordinates_lat,
            point.coordinates_lng
          )
        }
      }))
    },
    lines: {
      type: 'FeatureCollection',
      features: lineAdventures.map((line) => ({
        type: 'Feature',
        id: line.adventure_id,
        properties: {
          adventureType: line.adventure_type,
          adventureName: line.adventure_name,
          color: adventurePathColor(line.adventure_type)
        },
        geometry: {
          type: 'LineString',
          coordinates: line.path
        }
      }))
    }
  }
}

const formatShortAdventure = (adventure) => {
  const shortAdventureProperties = [
    'adventure_id',
    'adventure_name',
    'adventure_type',
    'difficulty',
    'rating',
    'nearest_city',
    'coordinates_lat',
    'coordinates_lng'
  ]

  const hasAllProperties = shortAdventureProperties.every((property) =>
    Object.keys(adventure).includes(property)
  )

  if (!hasAllProperties) {
    throw 'database query failed to include all short adventure properties'
  }

  const pathProperties = {
    ski: 'ski_path',
    hike: 'hike_path',
    bike: 'bike_path',
    skiApproach: 'ski_approach_path'
  }

  if (adventure[pathProperties[adventure.adventure_type]]) {
    adventure = removeUnusedVariables(adventure)
  }

  return {
    adventure_id: adventure.adventure_id,
    adventure_name: adventure.adventure_name,
    adventure_type: adventure.adventure_type,
    difficulty: adventure.difficulty,
    rating: adventure.rating,
    nearest_city: adventure.nearest_city,
    coordinates: formatCoordsObject(
      adventure.coordinates_lat,
      adventure.coordinates_lng
    ),
    ...(adventure.path && { path: adventure.path })
  }
}

const formatShortZone = (zone) => {
  const shortZoneProperties = [
    'zone_id',
    'zone_name',
    'adventure_type',
    'nearest_city',
    'coordinates_lat',
    'coordinates_lng'
  ]

  const hasAllProperties = shortZoneProperties.every((property) =>
    Object.keys(zone).includes(property)
  )

  if (!hasAllProperties) {
    throw 'database query failed to include all short zone properties'
  }

  return {
    zone_id: zone.zone_id,
    zone_name: zone.zone_name,
    adventure_type: zone.adventure_type,
    nearest_city: zone.nearest_city,
    coordinates: formatCoordsObject(zone.coordinates_lat, zone.coordinates_lng)
  }
}

const formatShortUser = (user) => {
  const shortUserProperties = [
    'user_id',
    'display_name',
    'first_name',
    'email',
    'profile_picture_url'
  ]

  const hasAllProperties = shortUserProperties.every((property) => {
    Object.keys(user).includes(property)
  )

  if (!hasAllProperties) {
    throw 'database query failed to include all short user properties'
  }

  return {
    user_id: user.user_id,
    display_name: user.display_name,
    first_name: user.first_name,
    email: user.email,
    profile_picture_url: user.profile_picture_url
  }
}

const formatCoordsObject = (lat, lng) => {
  return {
    lat: parseFloat(lat.toFixed(6)),
    lng: parseFloat(lng.toFixed(6))
  }
}

const formatCoordsGeo = (lat, lng) => {
  return [parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))]
}

const formatCreator = (parent) => {
  const creator = formatShortUser(parent)

  delete parent.user_id
  delete parent.display_name
  delete parent.first_name
  delete parent.email
  delete parent.profile_picture_url

  parent.creator = creator

  return parent
}

module.exports = {
  formatAdventureForGeoJSON,
  formatShortAdventure,
  formatShortZone,
  formatShortUser,
  formatCoordsObject,
  formatCoordsGeo,
  formatCreator
}
