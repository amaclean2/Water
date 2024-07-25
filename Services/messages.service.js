const Water = require('.')
const logger = require('../Config/logger')
const { formatDataFromMessage } = require('./utils/handlers')
const { createAPNNotification } = require('./utils/notifications')

class MessagingService extends Water {
  constructor(sendQuery, jwtSecret) {
    super(sendQuery, jwtSecret)
  }

  /**
   * @param {Object} params
   * @param {number[]} params.userIds
   * @returns {Promise<NewConversationReturnType>} | { conversation_exists: Bool, conversations: Conversation[] }
   */
  async createConversation({ userIds, senderId }) {
    // create a new row in the conversations table
    // create new rows in the conversation_interactions table for each user in the conversation
    try {
      const conversations = await this.messageDB.findConversation({
        userIds,
        senderId
      })

      if (conversations.length) {
        logger.info(
          `conversations found: ${conversations.map(
            (convo) => convo.conversation_id
          )}`
        )

        return {
          conversation_exists: true,
          conversations
        }
      } else {
        logger.info('creating a new conversation')

        const conversationId = await this.messageDB.createNewConversation()

        await this.messageDB.saveNewConversationInteractions({
          userIds,
          conversationId
        })

        const conversation = {
          users: await this.userDB.getShortUsers({ userIds }),
          conversation_id: conversationId,
          last_message: '',
          unread: false
        }

        conversation.conversation_name = this.messageDB.buildConversationName(
          conversation,
          senderId
        )

        return {
          conversation_exists: false,
          conversations: [conversation]
        }
      }
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.userId | the new user in the conversation
   * @param {number} params.conversationId | then conversation to be modified
   * @returns {Promise<Object>} | this returns an object containing two properties
   * 1. `newUserConversations` is a new conversations list for the new user
   * 2. `newUser` a shortUser object to add to the users in the conversation
   */
  async expandConversation({ userId, conversationId }) {
    try {
      await this.messageDB.addUserToConversation({
        userId,
        conversationId
      })

      const newUserConversations = await this.messageDB.getUserConversations({
        userId
      })
      const newUser = await this.userDB.getShortUsers({ userIds: [userId] })

      return { newUserConversations, newUser }
    } catch (error) {
      if (error === 'userAlreadyExists') {
        throw new Error('User already exists in conversation')
      }

      throw logger.error(`failed to add user to conversation: ${error}`)
    }
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
  async getConversation({ conversationId, userId }) {
    // look through the messages table and get all the messages with the provided conversationId
    // then update the unread variable for that user and conversation
    try {
      const messages = await this.messageDB.getMessagesPerConversation({
        conversationId
      })

      await this.messageDB.clearUnreadConversation({ userId, conversationId })

      return { messages, conversation_id: conversationId }
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.conversationId
   * @param {number} params.senderId
   * @param {string} params.messageBody
   * @param {string} params.dataReference
   * @param {string} params.senderName
   * @returns {Promise<{message_body: string, user_id: number, conversation_id: number, data_reference: string, applied_tokens: Array<string>}>} | an object containing all the relevant data about the message
   */
  async sendMessage({
    conversationId,
    senderId,
    messageBody,
    dataReference,
    senderName
  }) {
    // add a new message to the database
    try {
      if (!conversationId || !senderId || !messageBody) {
        throw 'conversationId, senderId and messageBody are required fields'
      }

      const { data, message } = formatDataFromMessage(messageBody)

      await this.messageDB.saveNewMessage({
        conversationId,
        senderId,
        messageBody: message,
        dataReference: data
      })

      // set the unread notification status for the sending user
      await this.messageDB.updateUnreadForUser({
        userId: senderId,
        conversationId
      })

      // set the last message for the conversation
      await this.messageDB.setLastMessageInConversation({
        lastMessage: messageBody,
        conversationId
      })

      // get all connected device tokens in the conversation
      const tokens = await this.messageDB.getDeviceTokensPerConversation({
        conversationId
      })
      const formattedTokens = tokens
        .filter(({ user_id }) => user_id !== senderId)
        .map(({ token }) => token)

      // send a notification to all connected clients
      if (formattedTokens.length) {
        logger.info(JSON.stringify({ deviceTokens: formattedTokens }))

        logger.info('Sending notifications to connected device tokens')
        createAPNNotification({
          senderName,
          messageBody,
          deviceTokens: formattedTokens
        })
      }

      // return the formatted data
      return {
        display_name: senderName,
        message_body: messageBody,
        user_id: senderId,
        conversation_id: conversationId,
        data_reference: dataReference ?? '',
        date_created: new Date().getTime()
      }
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.userId
   * @param {string} params.token
   * @returns {Promise<string>} | a success message
   */
  async saveDeviceToken({ userId, token }) {
    try {
      if (!userId || !token) {
        throw 'userId and token are required'
      }

      const success = await this.messageDB.addTokenDb({ userId, token })
      logger.info(success)
      return success
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  /**
   *
   */
  deleteConversation({}) {}
}

module.exports = MessagingService
