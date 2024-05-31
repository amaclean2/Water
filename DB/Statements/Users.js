/**
 * I want all the users I am friends with
 * That means all the users I follow or the users that follow me
 * Select all the followers where leader_id is me
 * And all the users where follower_id is me
 */

const createUserStatement =
  'INSERT INTO users (email, first_name, last_name, password, profile_picture_url) VALUES(?, ?, ?, ?, ?)'
const selectUserIdStatement = 'SELECT id FROM users WHERE email = ?'
const getUserWithEmailStatement =
  'SELECT first_name, last_name, email, bio, city, id, password, phone, user_site, profile_picture_url, email_opt_out FROM users WHERE email = ?'
const getUserByIdStatement =
  'SELECT first_name, last_name, email, bio, city, id, password, phone, user_site, profile_picture_url, email_opt_out FROM users WHERE id = ?'
const updateUserStatements = {
  first_name:
    'UPDATE users SET first_name = ?, last_updated = NOW() WHERE id = ?',
  last_name:
    'UPDATE users SET last_name = ?, last_updated = NOW() WHERE id = ?',
  email: 'UPDATE users SET email = ?, last_updated = NOW() WHERE id = ?',
  phone: 'UPDATE users SET phone = ?, last_updated = NOW() WHERE id = ?',
  is_premiun:
    'UPDATE users SET is_premium = ?, last_updated = NOW() WHERE id = ?',
  sex: 'UPDATE users SET sex = ?, last_updated = NOW() WHERE id = ?',
  user_site:
    'UPDATE users SET user_site = ?, last_updated = NOW() WHERE id = ?',
  password:
    'UPDATE users SET first_name = ?, last_updated = NOW() WHERE id = ?',
  city: 'UPDATE users SET city = ?, last_updated = NOW() WHERE id = ?',
  bio: 'UPDATE users SET bio = ?, last_updated = NOW() WHERE id = ?',
  profile_picture_url:
    'UPDATE users SET profile_picture_url = ?, last_updated = NOW() WHERE id = ?'
}
const deleteUserStatement = 'DELETE FROM users WHERE id = ?'
const optOutOfEmailStatement =
  'UPDATE users SET email_opt_out = 1 WHERE email = ?'

module.exports = {
  createUserStatement,
  selectUserIdStatement,
  getUserWithEmailStatement,
  getUserByIdStatement,
  updateUserStatements,
  deleteUserStatement,
  optOutOfEmailStatement
}
