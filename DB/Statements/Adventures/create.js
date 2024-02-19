// create new statements
const createNewSkiAdventureStatement =
  'INSERT INTO adventures (adventure_ski_id, adventure_name, adventure_type, bio, coordinates_lat, coordinates_lng, creator_id, nearest_city, public, rating, difficulty) VALUES ?'
const createNewClimbAdventureStatement =
  'INSERT INTO adventures (adventure_climb_id, adventure_name, adventure_type, bio, coordinates_lat, coordinates_lng, creator_id, nearest_city, public, rating, difficulty) VALUES ?'
const createNewHikeAdventureStatement =
  'INSERT INTO adventures (adventure_hike_id, adventure_name, adventure_type, bio, coordinates_lat, coordinates_lng, creator_id, nearest_city, public, rating, difficulty) VALUES ?'
const createNewBikeAdventureStatement =
  'INSERT INTO adventures (adventure_bike_id, adventure_name, adventure_type, bio, coordinates_lat, coordinates_lng, creator_id, nearest_city, public, rating, difficulty) VALUES ?'
const createNewSkiApproachStatement =
  'INSERT INTO adventures (ski_approach_id, adventure_name, adventure_type, bio, coordinates_lat, coordinates_lng, creator_id, nearest_city, public, rating, difficulty) VALUES ?'
const createNewSkiStatement =
  'INSERT INTO ski (avg_angle, max_angle, aspect, summit_elevation, base_elevation, exposure, season, trail_path, elevations) VALUES ?'
const createNewClimbStatement =
  'INSERT INTO climb (pitches, protection, climb_type, light_times, season, approach, first_ascent) VALUES ?'
const createNewHikeStatement =
  'INSERT INTO hike (summit_elevation, base_elevation, distance, season, trail_path, elevations) VALUES ?'
const createNewBikeStatement =
  'INSERT INTO bike (summit_elevation, base_elevation, distance, season, trail_path, elevations, climb, descent) VALUES ?'
const createNewApproachStatement =
  'INSERT INTO ski_approach (distance, summit_elevation, base_elevation, gear, trail_path, elevations, exposure) VALUES ?'
const addKeywordStatement =
  'REPLACE INTO searchable_adventures (searchable_text, adventure_id) VALUES (?, ?)'

module.exports = {
  createNewSkiAdventureStatement,
  createNewClimbAdventureStatement,
  createNewHikeAdventureStatement,
  createNewBikeAdventureStatement,
  createNewSkiApproachStatement,
  createNewSkiStatement,
  createNewClimbStatement,
  createNewHikeStatement,
  createNewBikeStatement,
  createNewApproachStatement,
  addKeywordStatement
}
