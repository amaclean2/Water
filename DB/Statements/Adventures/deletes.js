const deleteSkiStatement =
  'DELETE FROM ski AS s INNER JOIN adventures AS a ON a.adventure_ski_id = s.id WHERE s.id = a.adventure_ski_id AND a.id = ?'
const deleteClimbStatement =
  'DELETE FROM climb AS c INNER JOIN adventures AS a ON a.adventure_climb_id = c.id WHERE c.id = a.adventure_climb_id AND a.id = ?'
const deleteHikeStatement =
  'DELETE FROM hike AS h INNER JOIN adventures AS a ON a.adventure_hike_id = h.id WHERE h.id = a.adventure_hike_id AND a.id = ?'
const deleteBikeStatement =
  'DELETE FROM bike AS b INNER JOIN adventures AS a ON a.adventure_bike_id = b.id WHERE b.id = a.adventure_bike_id AND a.id = ?'
const deleteSkiApproachStatement =
  'DELETE FROM ski_approach AS sa INNER JOIN adventures As a ON a.ski_approach_id = sa.id WHERE sa.id = a.ski_approach_id AS a.id = ?'

module.exports = {
  deleteSkiStatement,
  deleteClimbStatement,
  deleteHikeStatement,
  deleteBikeStatement,
  deleteSkiApproachStatement
}
