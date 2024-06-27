// get adventure type
const getAdventureTypeStatement =
  'SELECT adventure_type FROM adventures WHERE id = ?'

// get all adventure details per an adventure id and type
const selectAdventureByIdGroup = {
  ski: `SELECT
    a.id,
    a.adventure_name,
    a.adventure_type,
    a.bio,
    a.coordinates_lat,
    a.coordinates_lng,
    a.creator_id AS user_id,
    CONCAT(u.first_name, " ", u.last_name) AS display_name,
    u.first_name,
    u.profile_picture_url,
    u.email,
    a.date_created,
    a.nearest_city,
    a.public,
    a.rating,
    s.avg_angle,
    s.trail_path AS path,
    s.elevations,
    s.max_angle,
    s.aspect,
    a.difficulty,
    s.summit_elevation,
    s.base_elevation,
    s.exposure,
    s.season
    FROM adventures AS a
    INNER JOIN ski AS s ON a.adventure_ski_id = s.id
    INNER JOIN users AS u ON a.creator_id = u.id
    WHERE a.id = ?`,
  climb: `SELECT
    a.id,
    a.difficulty,
    a.adventure_name,
    a.adventure_type,
    a.bio,
    a.coordinates_lat,
    a.coordinates_lng,
    a.creator_id AS user_id,
    CONCAT(u.first_name, " ", u.last_name) AS display_name,
    u.first_name,
    u.email,
    u.profile_picture_url,
    a.date_created,
    a.nearest_city,
    a.public,
    a.rating,
    c.first_ascent,
    c.pitchess,
    c.protection,
    c.approach,
    c.climb_type,
    c.season
    FROM adventures AS a INNER JOIN climb AS c ON a.adventure_climb_id = c.id INNER JOIN users AS u ON a.creator_id = u.id WHERE a.id = ?`,
  hike: `SELECT
    a.id,
    a.adventure_name,
    a.adventure_type,
    a.bio,
    a.coordinates_lat,
    a.coordinates_lng,
    a.creator_id AS user_id,
    CONCAT(u.first_name, " ", u.last_name) AS display_name,
    u.first_name,
    u.email,
    u.profile_picture_url,
    a.date_created,
    a.nearest_city,
    a.public,
    a.rating,
    a.difficulty,
    h.trail_path AS path,
    h.elevations,
    h.summit_elevation,
    h.climb,
    h.descent,
    h.base_elevation,
    h.season
    FROM adventures AS a INNER JOIN hike AS h ON a.adventure_hike_id = h.id INNER JOIN users AS u ON a.creator_id = u.id WHERE a.id = ?`,
  bike: `SELECT
    a.id,
    a.adventure_name,
    a.adventure_type,
    a.bio,
    a.coordinates_lat,
    a.coordinates_lng,
    a.creator_id AS user_id,
    CONCAT(u.first_name, " ", u.last_name) AS display_name,
    u.first_name,
    u.email,
    u.profile_picture_url,
    a.date_created,
    a.nearest_city,
    a.public,
    a.rating,
    a.difficulty,
    b.trail_path AS path,
    b.elevations,
    b.summit_elevation,
    b.climb,
    b.descent,
    b.base_elevation,
    b.season
    FROM adventures AS a INNER JOIN bike AS b ON a.adventure_bike_id = b.id INNER JOIN users AS u ON a.creator_id = u.id WHERE a.id = ?`,
  skiApproach: `SELECT
      a.id,
      a.adventure_name,
      a.adventure_type,
      a.bio,
      a.coordinates_lat,
      a.coordinates_lng,
      a.creator_id AS user_id,
      CONCAT(u.first_name, " ", u.last_name) AS display_name,
      u.first_name,
      u.email AS email,
      u.profile_picture_url,
      a.date_created,
      a.nearest_city,
      a.public,
      a.rating,
      a.difficulty,
      sa.trail_path AS path,
      sa.elevations AS ,
      sa.summit_elevation,
      sa.base_elevation,
      sa.gear,
      sa.exposuree
      FROM adventures AS a
      INNER JOIN ski_approach AS sa ON a.ski_approach_id = sa.id
      INNER JOIN users AS u ON a.creator_id = u.id
      WHERE a.id = ?`
}
// get adventures by distance within a type
const getCloseAdventures = `SELECT
  id AS adventure_id,
  adventure_name,
  adventure_type,
  difficulty,
  rating,
  nearest_city,
  coordinates_lat,
  coordinates_lng
  FROM adventures
  WHERE public = 1 AND adventure_type = ?
  ORDER BY SQRT(POWER(coordinates_lat - ?, 2) + POWER(coordinates_lng - ?, 2)) LIMIT ?`

const getCloseAdventuresGivenZone = `
SELECT
a.id AS adventure_id,
a.adventure_name,
a.adventure_type,
a.difficulty,
a.rating,
a.nearest_city,
a.coordinates_lat,
a.coordinates_lng
FROM adventures AS a
LEFT JOIN zone_interactions AS zi ON a.id = zi.adventure_child_id
WHERE public = 1 AND adventure_type = ? AND (zi.parent_id != ? OR zi.parent_id IS NULL)
ORDER BY SQRT(POWER(coordinates_lat - ?, 2) + POWER(coordinates_lng - ?, 2)) LIMIT ?`

// get an adventure rating and difficulty
const getAdventureRatingAndDifficulty =
  'SELECT rating, difficulty, id AS adventure_id, adventure_type FROM adventures WHERE id = ?'

// get all adventures pertaining to a given type which don't have a parent zone
const selectAdventuresStatement = `SELECT
a.adventure_type,
a.adventure_name,
a.id AS adventure_id,
a.coordinates_lat,
a.coordinates_lng,
s.trail_path AS ski_path,
h.trail_path AS hike_path,
b.trail_path AS bike_path,
sa.trail_path AS ski_approach_path
FROM adventures AS a
LEFT JOIN ski AS s ON a.adventure_ski_id = s.id
LEFT JOIN hike AS h ON a.adventure_hike_id = h.id
LEFT JOIN bike AS b ON a.adventure_bike_id = b.id
LEFT JOIN ski_approach AS sa ON a.ski_approach_id = sa.id
LEFT JOIN zone_interactions AS zi ON zi.adventure_child_id = a.id
WHERE a.adventure_type = ? AND a.public = 1 AND zi.parent_id IS NULL`

const selectSkiApproachStatement = `
  SELECT
  a.id AS adventure_id,
  a.adventure_name,
  a.adventure_type,
  a.coordinates_lat,
  a.coordinates_lng,
  sa.trail_path AS ski_approach_path
  FROM adventures AS a
  LEFT JOIN ski_approach AS sa ON a.ski_approach_id = sa.id
  LEFT JOIN zone_interactions AS zi ON zi.adventure_child_id = a.id
  WHERE a.adventure_type = "skiApproach" AND public = 1 AND zi.parent_id IS NULL`

const getSpecificAdventureId = `SELECT
    adventure_type,
    CASE 
    WHEN adventure_type = 'ski' THEN adventure_ski_id
    WHEN adventure_type = 'hike' THEN adventure_hike_id
    WHEN adventure_type = 'bike' THEN adventure_bike_id
    WHEN adventure_type = 'climb' THEN adventure_climb_id
    ELSE ski_approach_id END
    AS specific_adventure_id FROM adventures WHERE id = ?`

const buildBreadcrumbStatement = `
WITH RECURSIVE parents AS (
  SELECT
  a.id AS id,
  a.adventure_type,
  a.adventure_name AS name,
  zi.parent_id
  FROM adventures AS a
  LEFT JOIN zone_interactions AS zi ON a.id = zi.adventure_child_id
  WHERE a.id = ?
  UNION ALL
  SELECT
  z.id AS id,
  z.adventure_type,
  z.zone_name AS name,
  zi.parent_id
  FROM zones AS z
  LEFT JOIN zone_interactions AS zi ON z.id = zi.zone_child_id
  INNER JOIN parents AS p ON p.parent_id = z.id
)
SELECT name, id, adventure_type FROM parents`

module.exports = {
  getAdventureTypeStatement,
  buildBreadcrumbStatement,
  selectAdventureByIdGroup,
  selectSkiApproachStatement,
  getCloseAdventures,
  getCloseAdventuresGivenZone,
  getAdventureRatingAndDifficulty,
  selectAdventuresStatement,
  getSpecificAdventureId
}
