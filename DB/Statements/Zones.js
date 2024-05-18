// Get zone information
const getZoneInformationQuery = `SELECT
z.zone_name,
z.adventure_type,
z.bio,
z.coordinates_lat,
z.coordinates_lng,
z.date_created,
u.id AS creator_id,
CONCAT(u.first_name, ' ', u.last_name) AS creator_name,
u.email AS creator_email,
u.profile_picture_url
FROM zones AS z
INNER JOIN users AS u ON z.creator_id = u.id
WHERE id = ?`

const getAllZonesOfATypeQuery = `
SELECT
z.zone_name,
z.adventure_type,
z.coordinates_lat,
z.coordinates_lng,
z.date_created
FROM zones AS z
WHERE z.adventure_type = ?`

// Get zone adventures
const getZoneAdventuresQuery = `
SELECT
a.advneture_type,
a.adventure_name,
a.id AS adventure_id,
a.coordinates_lat,
a.coordiantes_lng,
a.public
FROM zones AS z 
INNER JOIN zone_interactions AS zi ON zi.parent_id = z.id
INNER JOIN adventures AS a ON zi.adventure_child_id = a.id
WHERE zi.interaction_type = 'adventure' AND z.id = ? AND a.public = 1`

// Get zone first layer subzones
const getZoneSubzoneQuery = `
SELECT
z2.advneture_type,
z2.zone_name,
z2.id AS zone_child_id,
z2.coordinates_lat,
z2.coordiantes_lng,
z2.public
FROM zones AS z
INNER JOIN zone_interactions AS zi ON zi.parent_id = z.id
INNER JOIN zones AS z2 ON zi.zone_child_id = z2.id
WHERE zi.interaction_type = 'zone' AND z.id = ? AND z2.public = 1`

// Create a zone
const createZoneQuery =
  'INSERT INTO zones (zone_name, adventure_type, coordinates_lat, coordinates_lng, creator_id, nearest_city, public) VALUES ?'

// Add an adventure to a zone
const addAdventureToZoneQuery =
  'INSERT INTO zone_interactions (adventure_child_id, parent_id) VALUES ?'

// Add a child zone to a zone
const addZoneToZoneQuery =
  'INSERT INTO zone_interactions (zone_child_id, parent_id) VALUES ?'

// Remove an adventure from a zone
const removeAdventureFromZoneQuery =
  'DELETE FROM zone_interactions WHERE adventure_child_id = ?'

// Remove a zone from a zone
const removeZoneFromZoneQuery =
  'DELETE FROM zone_interactions WHERE zone_child_id = ?'

// Edit a zone field
const editZoneFieldQuery = 'UPDATE zones SET ? = ? WHERE id = ?'

// Delete a zone (probably shouldn't do this will-nilly)
const deleteZoneQuery = ''

module.exports = {
  getZoneInformationQuery,
  getAllZonesOfATypeQuery,
  getZoneAdventuresQuery,
  getZoneSubzoneQuery,
  createZoneQuery,
  addAdventureToZoneQuery,
  addZoneToZoneQuery,
  removeAdventureFromZoneQuery,
  removeZoneFromZoneQuery,
  editZoneFieldQuery,
  deleteZoneQuery
}
