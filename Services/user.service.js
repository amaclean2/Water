const Water = require('.')
const { handleEmailUserFollowed } = require('./utils/email')
const SearchService = require('./search.service')
const { comparePassword, hashPassword } = require('./utils/crypto')
const {
  createThumb,
  createMain,
  createProfilePicture,
  createDefaultProfilePicture,
  removeImage
} = require('./utils/sharp')

class UserService extends Water {
  constructor(sendQuery, jwtSecret) {
    super(sendQuery, jwtSecret)
    this.search = new SearchService(sendQuery, jwtSecret)
  }

  /**
   * @private
   * @param {Object} params
   * @param {Object} params.initiation
   * @param {number} params.initiation.id
   * @param {string} params.initiation.email
   * @param {string} params.password | authenticate the password if provided
   * @param {Object} params.initiation.providedObject | if this is present then don't call the database to build the userObject
   * @returns {Promise<UserObject>}
   */
  async #buildUserObject({
    initiation: { id, email, providedObject },
    password
  }) {
    if (providedObject) {
      return {
        ...providedObject,
        friends: [],
        images: [],
        completed_adventures: [],
        todo_adventures: []
      }
    }

    let userObject
    let derivedId = id ? id : null

    if (id) {
      userObject = await this.userDB.getUserById({ userId: id })
    } else if (email) {
      userObject = await this.userDB.getUserByEmail({ email })
      derivedId = userObject.id
    } else {
      throw 'to retrieve a user, an id or email is required in the initiation object'
    }

    if (!userObject) {
      throw "an account couldn't be found"
    }

    if (password && !comparePassword(password, userObject.password)) {
      throw 'passwordNotFound'
    }

    delete userObject.password

    const todoAdventures = await this.todoDB.getTodoAdventuresByUser({
      userId: derivedId
    })
    const completedAdventures = await this.completedDB.getCompletedAdventures({
      userId: derivedId
    })
    const friends = await this.userDB.getFriendsData({ userId: derivedId })
    const images = await this.userDB.getUserImages({ userId: derivedId })

    const returnObj = {
      ...userObject,
      friends,
      images,
      completed_adventures: completedAdventures.map((activity) => ({
        ...activity,
        user_id: activity.creator_id
      })),
      todo_adventures: todoAdventures.map((adventure) => ({
        ...adventure,
        user_id: adventure.creator_id
      }))
    }

    return returnObj
  }

  /**
   * @param {Object} params
   * @param {string} params.email | user email
   * @param {string} params.password | user password
   * @param {string} params.confirmPassword | verify intentional password
   * @param {string} params.firstName | user first_name
   * @param {string} params.lastName | user last_name
   * @returns {Promise<NewUserResponse>} an object containing a new user and a token
   */
  async addNewUser({
    email,
    password,
    confirmPassword,
    firstName,
    lastName,
    baseImageUrl
  }) {
    if (password !== confirmPassword) {
      throw 'passwords do not match'
    }
    if (password.length < 5 || password.length > 50) {
      throw 'password length must be between 5 and 50 characters'
    }

    const hashedPassword = hashPassword(password)

    const userExists = await this.userDB.checkIfUserExistsByEmail({ email })

    if (userExists) {
      throw 'An account with this email aready exists. Please try a different email or login with that account.'
    }

    const { userId } = await this.userDB.addUserToDatabase({
      email,
      firstName,
      lastName,
      password: hashedPassword
    })

    const { fileName } = await createDefaultProfilePicture({
      directory: process.env.FILE_STORAGE_PATH,
      userId
    })

    const profileImageUrl = `${baseImageUrl}profile/${fileName}`

    await this.userDB.updateDatabaseUser({
      userId,
      fieldName: 'profile_picture_url',
      fieldValue: profileImageUrl
    })

    const user = await this.#buildUserObject({
      initiation: {
        providedObject: {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          id: userId,
          profile_picture_url: profileImageUrl
        }
      }
    })

    this.search.saveUserKeywords({
      searchableFields: user,
      userId
    })

    return { user, token: this.auth.issue({ id: userId }) }
  }

  /**
   * @param {Object} params
   * @param {string} params.password
   * @param {string} params.email
   * @returns {Promise<NewUserResponse>} an object with the user and a token
   */
  async loginWithEmailAndPassword({ email, password }) {
    const checkUser = await this.userDB.checkIfUserExistsByEmail({ email })

    if (!checkUser)
      throw 'There was no user found with that email. Please try again or create a new user.'

    const user = await this.#buildUserObject({
      initiation: { id: checkUser },
      password
    })
    const token = this.auth.issue({ id: user.id })
    return { user, token }
  }

  /**
   * @param {Object} params
   * @param {string} params.url
   * @param {string} params.token
   * @returns {Promise<UserObject>}
   */
  getPresignedInUser({ url, token }) {
    return this.auth
      .validate({ originalUrl: url, token })
      .then(({ idFromToken: userId }) => {
        if (!userId) {
          throw 'user is not logged in'
        }

        return this.#buildUserObject({ initiation: { id: userId } })
      })
  }

  /**
   * @param {Object} params
   * @param {number} params.id | user id required to get user
   * @returns {Promise<UserObject>}
   */
  getUserFromId({ userId }) {
    return this.#buildUserObject({ initiation: { id: userId } }).then(
      (user) => {
        delete user.phone
        return user
      }
    )
  }

  /**
   * @param {*} params
   * @param {string} params.searchString | the string to use in the search
   * @returns {Promise<UserObject[]>} | an array of users that match the search text
   */
  searchForUsers({ searchString }) {
    if (!searchString?.length) return []

    return this.search.userSearch({ keystring: searchString })
  }

  /**
   * @param {*} params
   * @param {string} params.searchString | the string to use in the search
   * @param {number} params.userId | the is of the user to search for friends of
   * @returns {Promise<UserObject[]>} an array of friends that match the search text
   */
  searchForFriends({ searchString, userId }) {
    if (!searchString?.length) return []

    return this.search.userSearch({ keystring: searchString, userId })
  }

  /**
   * @param {Object} ids
   * @param {number} ids.leaderId | the user being followed
   * @param {number} ids.followerId | the user following
   * @param {FriendEmailCallback} [testEmailCallback] | in jest this can be replaced with a mock
   * @returns {Promise<UserObject>} the following user with the new friends list
   */
  friendUser(ids, testEmailCallback) {
    return this.userDB.createUserFollowing(ids).then(() =>
      this.#buildUserObject({ initiation: { id: ids.followerId } }).then(
        (user) => {
          const newFriend = user.friends.find(({ id }) => id === ids.leaderId)

          const callback = testEmailCallback || handleEmailUserFollowed

          return callback({
            email: newFriend.email,
            followingUserName: newFriend.display_name
          }).then(() => user)
        }
      )
    )
  }

  /**
   * @param {Object} params
   * @param {number} params.userId | the id of the user to update
   * @param {string} params.fieldName | the field to update
   * @param {string} params.fieldValue | the new value
   * @return {Promise<void>}
   */
  editUser({ userId, fieldName, fieldValue }) {
    return this.userDB
      .updateDatabaseUser({ fieldName, fieldValue, userId })
      .then((updatedUser) =>
        this.search.saveUserKeywords({ searchableFields: updatedUser, userId })
      )
  }

  /**
   * @param {Object} params
   * @param {number} params.userId
   * @return {Promise<void>}
   */
  deleteUser({ userId }) {
    return this.userDB.databaseDeleteUser({ userId })
  }

  /**
   * @param {Object} params
   * @param {number} params.userId
   * @param {number} params.adventureId
   * @param {boolean} params.isPublic
   * @returns {Promise<CompletedResponse>}
   */
  completeAdventure({ userId, adventureId, isPublic }) {
    return this.todoDB
      .removeTodoAdventure({ adventureId, userId })
      .then(() =>
        this.completedDB.completeAdventure({ userId, adventureId, isPublic })
      )
  }

  /**
   * @param {Object} params
   * @param {number} params.userId
   * @param {number} params.adventureId
   * @param {boolean} params.isPublic
   * @returns {Promise<TodoResponse>}
   */
  addAdventureTodo({ userId, adventureId, isPublic }) {
    return this.todoDB.createNewTodoAdventure({ userId, adventureId, isPublic })
  }

  /**
   *
   * @param {Object} params
   * @param {string} params.url
   * @param {number} params.userId
   * @param {number} params.adventureId
   */
  async saveImage({ file, url, userId, adventureId, profilePicture }) {
    if (!userId || !url) {
      throw 'userId and url parameters are required'
    }

    if (profilePicture && adventureId) {
      throw 'this picture can only be saved either to an adventure or as a profile picture'
    }

    if (profilePicture !== undefined) {
      await createProfilePicture({ file })
      return this.userDB.updateDatabaseUser({
        fieldName: 'profile_picture_url',
        fieldValue: url,
        userId
      })
    }

    await createThumb({ file })
    await createMain({ file })

    return adventureId !== undefined
      ? this.adventureDB.saveImageToAdventure({ url, userId, adventureId })
      : this.userDB.saveImageToUser({ url, userId })
  }

  /**
   *
   * @param {Object} params
   * @param {string} params.url
   * @returns {Promise<void>}
   */
  removeGalleryImage({ url }) {
    return removeImage({ url }).then(() =>
      this.userDB.removeImageEntry({ url })
    )
  }

  /**
   *
   * @param {Object} params
   * @param {string} params.oldUrl
   * @param {number} params.userId
   * @returns {Promise<void>}
   */
  removeProfileImage({ userId, oldUrl }) {
    return removeImage({ url: oldUrl })
      .then(() =>
        createDefaultProfilePicture({
          directory: process.env.FILE_STORAGE_PATH,
          userId
        })
      )
      .then(({ fileName }) =>
        this.userDB.updateDatabaseUser({
          userId,
          fieldName: 'profile_picture_url',
          fieldValue: `${oldUrl.split('/profile').shift()}/profile/${fileName}`
        })
      )
  }

  /**
   *
   * @param {Object} params
   * @param {string} params.url
   * @param {number} params.userId
   * @param {string} params.oldUrl
   * @param {File} params.file
   * @returns {Promise<void>}
   */
  changeProfileImage({ userId, file, url, oldUrl }) {
    return removeImage({ url: oldUrl })
      .then(() => createProfilePicture({ file }))
      .then(() =>
        this.userDB.updateDatabaseUser({
          userId,
          fieldName: 'profile_picture_url',
          fieldValue: url
        })
      )
  }
}

module.exports = UserService
