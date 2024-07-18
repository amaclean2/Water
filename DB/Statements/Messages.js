const createNewMessageStatement =
  'INSERT INTO messages (conversation_id, sender_id, message_body, data_reference) VALUES (?, ?, ?, ?)'
const addLastMessageStatement =
  'UPDATE conversations SET last_message = ? WHERE conversation_id = ?'
const createNewConversationStatement =
  "INSERT INTO conversations (last_message) VALUES (' ')"
const createNewInteractionsStatement =
  'INSERT INTO conversation_interactions (user_id, conversation_id, unread) VALUES ?'

/**
 * find and return all the conversations between a set of users
 * takes two parameters:
 * - list of user_ids as a tuple
 * - length of user_id list
 */
const findConversationStatement = `
SELECT
u.id AS user_id,
u.first_name,
CONCAT(u.first_name, " ", u.last_name) AS display_name,
u.email,
u.profile_picture_url,
c.id AS conversation_id,
c.conversation_name,
c.last_message,
ci.unread
FROM users AS u
INNER JOIN conversation_interactions AS ci ON ci.user_id = u.id
INNER JOIN conversations AS c ON c.id = ci.conversation_id
WHERE ci.conversation_id IN (
  SELECT conversation_id
  FROM conversation_interactions
  WHERE user_id IN ?
  GROUP BY conversation_id
  HAVING COUNT(DISTINCT user_id) = ?
)
GROUP BY
u.first_name,
display_name,
u.email,
u.id,
u.profile_picture_url,
c.id,
c.conversation_name,
c.last_message,
ci.unread;`

const getUserConversationsStatement = `
SELECT
  CONCAT(u.first_name, ' ', u.last_name) AS user_display_name,
  u.first_name AS user_first_name,
  u.email AS user_email,
  u.profile_picture_url,
  c.last_message,
  c.last_updated,
  c.conversation_name,
  u.id AS user_id,
  ci.conversation_id,
  ci.unread
  FROM conversation_interactions AS ci
  INNER JOIN users AS u ON u.id = ci.user_id
  INNER JOIN conversations AS c ON c.id = ci.conversation_id
  WHERE conversation_id IN ( SELECT conversation_id FROM conversation_interactions WHERE user_id = ? )
  ORDER BY c.last_updated DESC`

const setUnreadStatement =
  'UPDATE conversation_interactions SET unread = 1 WHERE conversation_id = ? AND user_id != ?'
const setLastMessageStatement =
  'UPDATE conversations SET last_message = ? WHERE id = ?'
const clearUnreadStatement =
  'UPDATE conversation_interactions SET unread = 0 WHERE user_id = ? AND conversation_id = ?'
const getConversationMessagesStatement = `
SELECT
CONCAT(u.first_name, ' ', u.last_name) AS display_name,
m.message_body,
m.data_reference,
m.date_created,
u.id AS user_id
FROM messages AS m
INNER JOIN users AS u ON m.sender_id = u.id
WHERE m.conversation_id = ?
ORDER BY m.id DESC
`
const deleteConversationStatement = `DELETE FROM conversations WHERE id = ?`
const insertDeviceTokenStatement =
  'REPLACE INTO device_tokens (token, user_id) VALUES (?, ?)'
const selectDeviceTokenStatement =
  'SELECT dt.token AS token, dt.user_id AS user_id FROM device_tokens AS dt INNER JOIN conversation_interactions AS ci ON dt.user_id = ci.user_id WHERE ci.conversation_id = ?'
const selectDeviceTokenForUserStatement =
  'SELECT token FROM device_tokens WHERE user_id = ?'

module.exports = {
  createNewMessageStatement,
  addLastMessageStatement,
  createNewConversationStatement,
  createNewInteractionsStatement,
  getUserConversationsStatement,
  setUnreadStatement,
  setLastMessageStatement,
  clearUnreadStatement,
  getConversationMessagesStatement,
  findConversationStatement,
  deleteConversationStatement,
  insertDeviceTokenStatement,
  selectDeviceTokenStatement,
  selectDeviceTokenForUserStatement
}
