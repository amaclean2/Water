const Water = require('.')
const logger = require('../Config/logger')
const SearchService = require('./search.service')

class MessagingService extends Water {
  constructor(sendQuery, jwtSecret) {
    super(sendQuery, jwtSecret)
    this.search = new SearchService(sendQuery, jwtSecret)
  }

  /**
   * @param {Object} params
   * @param {number[]} params.userIds
   * @returns {Promise<NewConversationReturnType>} | an object containing the
   * conversationId of the new conversation
   */
  createConversation({ userIds }) {
    // create a new row in the conversations table
    // create new rows in the conversation_interactions table for each user in the conversation
    return this.messageDB.findConversation({ userIds }).then((conversation) => {
      if (conversation) {
        return {
          conversation_exists: true,
          conversation
        }
      } else {
        return this.messageDB.saveNewConversation({
          userIds
        })
      }
    })
  }

  /**
   * @param {Object} params
   * @param {number} params.userId | the new user in the conversation
   * @param {number} params.conversationId | then conversation to be modified
   * @returns {Promise<void>} | if everything goes right, there shouldn't be anything to return
   */
  expandConversation({ userId, conversationId }) {
    return this.messageDB
      .addUserToConversation({ userId, conversationId })
      .then(logger.info)
      .catch((error) =>
        logger.error(`failed to add user to conversation: ${error}`)
      )
  }

  /**
   * @param {Object} params
   * @param {number} params.userId
   * @returns {Promise<ConversationResponseType>} | an object of conversations where the key
   * is the conversation id and the value is the conversation details
   */
  getConversationsPerUser({ userId }) {
    // look through the conversation_interactions table and find all the conversations for the current user
    return this.messageDB.getUserConversations({ userId })
  }

  /**
   * @param {Object} params
   * @param {number[]} users
   */
  getConversation({ conversationId, userId }) {
    let conversationMessages
    return this.messageDB
      .getMessagesPerConversation({ conversationId })
      .then((messages) => (conversationMessages = messages))
      .then(() =>
        this.messageDB.clearUnreadConversation({ userId, conversationId })
      )
      .then(() => conversationMessages)
    // look through the messages table and get all the messages with the provided conversationId
    // then update the unread variable for that user and conversation
  }

  /**
   * @param {Object} params
   * @param {number} params.conversationId
   * @param {number} params.senderId
   * @param {string} params.messageBody
   * @param {string} params.dataReference
   * @returns {Promise<MessageObject>} | an object containing all the relevant data about the message
   */
  sendMessage({ conversationId, senderId, messageBody, dataReference }) {
    // add a new message to the messages table
    let responseBody
    return this.messageDB
      .saveNewMessage({
        conversationId,
        senderId,
        messageBody,
        dataReference
      })
      .then(() => {
        responseBody = {
          message_body: messageBody,
          user_id: senderId,
          conversation_id: conversationId,
          data_reference: dataReference ?? null
        }
      })
      .then(() =>
        this.messageDB.updateUnread({
          userId: senderId,
          conversationId
        })
      )
      .then(() =>
        this.messageDB.setLastMessage({
          lastMessage: messageBody,
          conversationId
        })
      )
      .then(() => responseBody)
  }

  /**
   *
   */
  deleteConversation({}) {}
}

module.exports = MessagingService
