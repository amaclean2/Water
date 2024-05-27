// Get zone information
const getZoneInformationQuery = `SELECT
z.zone_name AS zone_name,
z.id AS id,
z.adventure_type AS adventure_type,
z.bio AS bio,
z.approach AS approach,
z.nearest_city AS nearest_city,
z.coordinates_lat AS coordinates_lat,
z.coordinates_lng AS coordinates_lng,
z.date_created AS date_created,
u.id AS creator_id,
CONCAT(u.first_name, ' ', u.last_name) AS creator_name,
u.email AS creator_email,
u.profile_picture_url AS profile_picture_url
FROM zones AS z
INNER JOIN users AS u ON z.creator_id = u.id
WHERE z.id = ?`

const getAllZonesOfATypeQuery = `
SELECT
id,
zone_name,
adventure_type,
coordinates_lat,
coordinates_lng
FROM zones
WHERE adventure_type = ?`

// Get zone adventures
const getZoneAdventuresQuery = `
SELECT
a.adventure_type,
a.adventure_name,
a.id AS adventure_id,
a.coordinates_lat,
a.coordinates_lng,
a.public
FROM zones AS z 
INNER JOIN zone_interactions AS zi ON zi.parent_id = z.id
INNER JOIN adventures AS a ON zi.adventure_child_id = a.id
WHERE zi.interaction_type = 'adventure' AND z.id = ? AND a.public = 1`

// Get zone first layer subzones
const getZoneSubzoneQuery = `
SELECT
z2.id AS zone_id,
z2.adventure_type,
z2.zone_name,
z2.id AS zone_child_id,
z2.coordinates_lat,
z2.coordinates_lng,
z2.public
FROM zones AS z
INNER JOIN zone_interactions AS zi ON zi.parent_id = z.id
INNER JOIN zones AS z2 ON zi.zone_child_id = z2.id
WHERE zi.interaction_type = 'zone' AND z.id = ? AND z2.public = 1`

// Get zones by distance
const getCloseZonesQuery = `SELECT
  id AS zone_id,
  zone_name,
  adventure_type,
  coordinates_lat,
  coordinates_lng,
  nearest_city,
  bio
  FROM zones
  WHERE public = 1 AND adventure_type = ?
  ORDER BY SQRT(POWER(coordinates_lat - ?, 2) + POWER(coordinates_lng - ?, 2)) LIMIT ?`

// Search zones (needs new table searchable_zones)
const searchZoneQuery = `
  SELECT
  z.zone_name,
  z.id,
  z.adventure_type,
  z.nearest_city
  FROM zones AS z
  INNER JOIN searchable_zones AS sz ON sz.zone_id = z.id
  WHERE sz.searchable_text LIKE ?
  `

// Get any parent of a zone
const getZoneParentQuery =
  'SELECT parent_id AS id FROM zone_interactions WHERE zone_child_id = ?'

// Get the intersecting adventure types between an adventure and a zone
const intersectingAdventureQuery =
  'SELECT z.adventure_type AS zone_adventure_type, a.adventure_type AS adventure_type FROM zones AS z INNER JOIN adventures AS a ON a.id = ? WHERE z.id = ?'

// Get the insersecting zone types between two zones
const intersectingZoneQuery =
  'SELECT DISTINCT adventure_type FROM zones WHERE id IN (?, ?);'

// Create a zone
const createZoneQuery =
  'INSERT INTO zones (zone_name, adventure_type, coordinates_lat, coordinates_lng, creator_id, nearest_city, public) VALUES ?'

const createZoneKeywordsQuery =
  'REPLACE INTO searchable_zones (searchable_text, zone_id) VALUES ?'

// Add an adventure to a zone
const addAdventureToZoneQuery =
  'REPLACE INTO zone_interactions (adventure_child_id, parent_id, interaction_type) VALUES ?'

// Add a child zone to a zone
const addZoneToZoneQuery =
  'REPLACE INTO zone_interactions (zone_child_id, parent_id, interaction_type) VALUES ?'

// Remove an adventure from a zone
const removeAdventureFromZoneQuery =
  'DELETE FROM zone_interactions WHERE adventure_child_id IN ?'

// Remove a zone from a zone
const removeZoneFromZoneQuery =
  'DELETE FROM zone_interactions WHERE zone_child_id IN ?'

// Edit a zone field
const editZoneFieldQueries = {
  zone_name: 'UPDATE zones SET zone_name = ? WHERE id = ?',
  bio: 'UPDATE zones SET bio = ? WHERE id = ?',
  approach: 'UPDATE zones SET approach = ? WHERE id = ?',
  coordinates_lat: 'UPDATE zones SET coordinates_lat = ? WHERE id = ?',
  coordinates_lng: 'UPDATE zones SET coordinates_lng = ? WHERE id = ?',
  nearest_city: 'UPDATE zones SET nearest_city = ? WHERE id = ?',
  is_public: 'UPDATE zones SET public = ? WHERE id = ?'
}

// Delete a zone (probably shouldn't do this will-nilly)
const deleteZoneQuery = 'DELETE FROM zones WHERE id = ?'

const deleteZoneInteractionsQuery =
  'DELETE FROM zone_interactions WHERE parent_id = ? OR zone_child_id = ?'

module.exports = {
  getZoneInformationQuery,
  getAllZonesOfATypeQuery,
  getZoneAdventuresQuery,
  getZoneSubzoneQuery,
  getCloseZonesQuery,
  searchZoneQuery,
  createZoneKeywordsQuery,
  getZoneParentQuery,
  intersectingAdventureQuery,
  intersectingZoneQuery,
  createZoneQuery,
  addAdventureToZoneQuery,
  addZoneToZoneQuery,
  removeAdventureFromZoneQuery,
  removeZoneFromZoneQuery,
  editZoneFieldQueries,
  deleteZoneQuery,
  deleteZoneInteractionsQuery
}
