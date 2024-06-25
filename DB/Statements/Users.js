const createUserStatement =
  'INSERT INTO users (email, first_name, last_name, password, profile_picture_url) VALUES(?, ?, ?, ?, ?)'
const selectUserIdStatement = 'SELECT id FROM users WHERE email = ?'
const getUserWithEmailStatement = `SELECT
first_name,
last_name,
email,
bio,
city,
id,
password,
phone,
user_site,
profile_picture_url,
email_opt_out
FROM users WHERE email = ?`
const getUserByIdStatement =
  'SELECT first_name, last_name, email, bio, city, id, password, phone, user_site, profile_picture_url, email_opt_out FROM users WHERE id = ?'
const updateUserStatement = 'UPDATE `users` SET ?? = ? WHERE id = ?'
const deleteUserStatement = 'DELETE FROM users WHERE id = ?'
const optOutOfEmailStatement =
  'UPDATE users SET email_opt_out = 1 WHERE email = ?'

const followUserStatement =
  'INSERT INTO friends (follower_id, leader_id, public) VALUES (?, ?, ?)'
const getFriendsStatement =
  "SELECT CONCAT(l.first_name, ' ', l.last_name) AS leader_display_name, l.first_name AS leader_first_name, l.email_opt_out AS leader_email_opt, l.id AS leader_id, l.email AS leader_email, l.profile_picture_url AS leader_picture, CONCAT(m.first_name, ' ', m.last_name) AS follower_display_name, m.email_opt_out AS follower_email_opt, m.email AS follower_email, m.id AS follower_id, m.profile_picture_url AS follower_picture, m.first_name AS follower_first_name FROM friends AS f INNER JOIN users AS l ON f.leader_id = l.id INNER JOIN users AS m ON f.follower_id = m.id WHERE f.leader_id = ? OR f.follower_id = ?"
const getFriendsCountStatement =
  'SELECT COUNT(follower_id) FROM friends WHERE leader_id = ? OR follower_id = ?'
const getIsFriendStatement =
  'SELECT * FROM friends WHERE (follower_id = ? AND leader_id = ?) OR (follower_id = ? AND leader_id = ?)'
const deleteFriendStatement =
  'DELETE FROM friends WHERE follower_id = ? OR leader_id = ?'

module.exports = {
  createUserStatement,
  selectUserIdStatement,
  getUserWithEmailStatement,
  getUserByIdStatement,
  updateUserStatement,
  deleteUserStatement,
  optOutOfEmailStatement,
  followUserStatement,
  getFriendsStatement,
  getFriendsCountStatement,
  getIsFriendStatement,
  deleteFriendStatement
}
