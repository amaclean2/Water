const DataLayer = require('..')
const logger = require('../../Config/logger')
const {
  createNewMessageStatement,
  createNewConversationStatement,
  createNewInteractionsStatement,
  getUserConversationsStatement,
  setUnreadStatement,
  getConversationMessagesStatement,
  clearUnreadStatement,
  findConversationStatement,
  setLastMessageStatement,
  insertDeviceTokenStatement,
  selectDeviceTokenStatement
} = require('../Statements/Messages')
const {
  failedInsertion,
  failedQuery,
  failedUpdate
} = require('../Utils/Errors')
const { formatShortUser } = require('../Utils/Formatters')

class MessageDataLayer extends DataLayer {
  /**
   * @param {Object} params
   * @param {number} params.conversationId
   * @param {number} params.senderId
   * @param {string} params.messageBody
   * @param {string} [params.dataReference] | an optional reference to a url
   * of any file to be included in the message
   * @returns {Promise<Object>} | an object containing the new id of
   * the message as insertId
   */
  async saveNewMessage({
    conversationId,
    senderId,
    messageBody,
    dataReference = ''
  }) {
    try {
      const [{ insertId }] = await this.sendQuery(createNewMessageStatement, [
        conversationId,
        senderId,
        messageBody,
        dataReference
      ])
      return { insertId }
    } catch (error) {
      throw failedInsertion(errror)
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.userId
   * @param {number} params.conversationId
   * @returns {Promise<void>}
   */
  async updateUnreadForUser({ userId, conversationId }) {
    try {
      await this.sendQuery(setUnreadStatement, [conversationId, userId])
    } catch (error) {
      throw failedUpdate(error)
    }
  }

  /**
   * @param {Object} params
   * @param {string} params.lastMessage
   * @param {number} params.conversationId
   * @returns {Promise<void>}
   */
  setLastMessageInConversation({ lastMessage, conversationId }) {
    return this.sendQuery(setLastMessageStatement, [
      lastMessage,
      conversationId
    ]).catch(failedUpdate)
  }

  clearUnreadConversation({ userId, conversationId }) {
    return this.sendQuery(clearUnreadStatement, [userId, conversationId]).catch(
      failedUpdate
    )
  }

  /**
   * @param {Object} params
   * @param {number[]} params.userIds | all the users in the conversation
   * @returns {Promise<NewConversationReturnType>} | an object containing the
   * conversationId of the new conversation
   */
  async createNewConversation() {
    try {
      // create a new conversation with last_message property = ''
      const [{ insertId: conversationId }] = await this.sendQuery(
        createNewConversationStatement
      )

      return conversationId
    } catch (error) {
      failedInsertion(error)
      throw error
    }
  }

  async saveNewConversationInteractions({ userIds, senderId, conversationId }) {
    try {
      // take the conversation id created above and add it to each user to create conversation_interactions
      // with user_id and conversation_id
      await this.sendQuery(createNewInteractionsStatement, [
        userIds.map((userId) => [userId, conversationId, false])
      ])
    } catch (error) {
      throw failedInsertion(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.userId | the new user in the conversation
   * @param {number} params.conversationId | then conversation to be modified
   * @returns {Promise<void>} | nutin
   */
  async addUserToConversation({ userId, conversationId }) {
    try {
      if (typeof userId === 'number' && typeof conversationId === 'number') {
        logger.info('received userId and conversationId from api')
      }

      await this.sendQuery(createNewInteractionsStatement, [
        [[userId, conversationId, true]]
      ])

      return 'user added to conversation'
    } catch (error) {
      if (error.message.includes('Duplicate entry')) {
        throw 'userAlreadyExists'
      }
      throw failedInsertion(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number[]} params.userIds
   * @returns {Promise<conversation[]>} | all conversations if the two users are in any conversations together
   */
  async findConversation({ userIds, senderId }) {
    // if a conversation exists return the conversation, otherwise return false
    try {
      const [results] = await this.sendQuery(findConversationStatement, [
        [userIds],
        [userIds],
        userIds.length
      ])

      const conversations = Object.values(
        results.reduce((acc, convo) => {
          if (acc[convo.id]) {
            acc[convo.id].users[convo.user_id] = formatShortUser({
              user_id: convo.user_id,
              display_name: convo.display_name,
              first_name: convo.first_name,
              email: convo.email,
              profile_picture_url: convo.profile_picture_url ?? ''
            })
          } else {
            acc[convo.id] = {
              users: {
                [convo.user_id]: formatShortUser({
                  user_id: convo.user_id,
                  display_name: convo.display_name,
                  first_name: convo.first_name,
                  email: convo.email,
                  profile_picture_url: convo.profile_picture_url ?? ''
                })
              },
              conversation_id: convo.conversation_id,
              conversation_name: convo.conversation_name,
              last_message: convo.last_message,
              unread: Boolean(convo.unread)
            }
          }
          return acc
        }, {})
      )

      return conversations.map((convo) => ({
        ...convo,
        conversation_name: this.buildConversationName(convo, senderId)
      }))
    } catch (error) {
      throw failedQuery(error)
    }
  }

  buildConversationName(conversation, userId) {
    if (conversation.conversation_name) {
      return conversation.conversation_name
    } else if (Object.keys(conversation.users).length < 3) {
      return Object.values(conversation.users).find(
        ({ user_id }) => user_id != userId
      ).display_name
    } else {
      return Object.values(conversation.users)
        .filter(({ user_id }) => user_id != userId)
        .map(({ first_name }) => first_name)
        .join(', ')
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.userId
   * @returns {Promise<ConversationResponseType[]>} | an object with the key being the
   * conversation_id and the value being a conversation object
   */
  async getUserConversations({ userId }) {
    try {
      const [results] = await this.sendQuery(getUserConversationsStatement, [
        userId,
        userId
      ])
      const conversations = {}
      results.forEach((result) => {
        if (conversations[result.conversation_id]) {
          conversations[result.conversation_id].users[result.user_id] =
            formatShortUser({
              display_name: result.user_display_name,
              first_name: result.user_first_name,
              email: result.user_email,
              user_id: result.user_id,
              profile_picture_url: result.profile_picture_url
            })
        } else {
          conversations[result.conversation_id] = {
            users: {
              [result.user_id]: formatShortUser({
                display_name: result.user_display_name,
                first_name: result.user_first_name,
                email: result.user_email,
                user_id: result.user_id,
                profile_picture_url: result.profile_picture_url
              })
            },
            conversation_id: result.conversation_id,
            last_message: result.last_message,
            last_updated: new Date(result.last_updated).getTime(),
            ...(result.user_id === userId && { unread: !!result.unread })
          }
        }

        if (result.user_id === userId) {
          conversations[result.conversation_id].unread = Boolean(result.unread)
        }
      })

      for (let i in conversations) {
        conversations[i].conversation_name = this.buildConversationName(
          conversations[i],
          userId
        )
      }

      return conversations
    } catch (error) {
      throw failedQuery(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.conversationId
   * @returns {Promise<MessageResponse[]>}
   */
  async getMessagesPerConversation({ conversationId }) {
    try {
      const [results] = await this.sendQuery(getConversationMessagesStatement, [
        conversationId
      ])

      return results.map((result) => ({
        ...result,
        conversation_id: conversationId,
        date_created: new Date(result.date_created).getTime()
      }))
    } catch (error) {
      throw failedQuery(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.userId
   * @param {string} param.token
   * @returns
   */
  async addTokenDb({ userId, token }) {
    try {
      await this.sendQuery(insertDeviceTokenStatement, [token, userId])

      return `token added or found succesfully for ${userId}`
    } catch (error) {
      throw failedInsertion(error)
    }
  }

  /**
   * @param {Object} params
   * @param {number} params.conversationId
   * @returns {Promise<Array<{token: string}>>}
   */
  async getDeviceTokensPerConversation({ conversationId }) {
    try {
      const [results] = await this.sendQuery(selectDeviceTokenStatement, [
        conversationId
      ])
      return results
    } catch (error) {
      throw failedQuery(error)
    }
  }
}

module.exports = MessageDataLayer
