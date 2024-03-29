const Water = require('.')
const logger = require('../Config/logger')

const stopWords = [
  'a',
  'an',
  'the',
  'i',
  'for',
  'with',
  'because',
  'this',
  'that',
  'is',
  'it',
  'is',
  'can',
  'be',
  'do',
  'did',
  'should',
  'would',
  'could',
  'my'
]

class SearchService extends Water {
  constructor(sendQuery, jwtSecret) {
    super(sendQuery, jwtSecret)

    this.adventureKeywordLibrary = [
      'adventure_name',
      'adventure_type',
      'bio',
      'creator_name',
      'nearest_city'
    ]

    this.userKeywordLibrary = [
      'first_name',
      'last_name',
      'bio',
      'email',
      'city'
    ]
  }

  parseString(term) {
    const termArray = term.split(' ')
    const sanitizedTermArray = new Set(
      termArray.map((term) => term.replace(/[,-.>!;:]/g, '').toLowerCase())
    )
    const removedStopWords = [...sanitizedTermArray].filter(
      (term) => !stopWords.includes(term)
    )

    const searchString = removedStopWords.join('')
    return searchString
  }

  /**
   * @param {Object} params
   * @param {Object} params.searchableFields | all the user fields to be searched
   * @param {number} params.userId
   * @returns {Promise<void>}
   */
  saveUserKeywords({ searchableFields, userId }) {
    const searchString = this.userKeywordLibrary
      .map((key) => {
        const text = searchableFields[key]
        return text ? this.parseString(text) : ''
      })
      .join('')
    return this.userDB.updateSearchUserKeywords({
      keyword: searchString,
      userId
    })
  }

  /**
   *
   * @param {Object} params
   * @param {string} params.keystring
   * @param {number} [params.userId] | optional parameter, forces find in friends
   * @returns
   */
  userSearch({ keystring, userId }) {
    const parsedString = this.parseString(keystring)

    if (userId) {
      return this.userDB.searchFriendString({ keywords: parsedString, userId })
    }

    return this.userDB.searchDatabaseForUserString({ keyword: parsedString })
  }

  /**
   * @param {Object} params
   * @param {Object} params.searchableFields | all the adventure fields to be searched
   * @param {number} params.adventureId
   * @returns {Promise<void>}
   */
  async saveAdventureKeywords({ searchableFields, adventureId }) {
    try {
      const searchString = this.adventureKeywordLibrary
        .map((key) => {
          const text = searchableFields[key]
          return text ? this.parseString(text) : ''
        })
        .join('')

      logger.info(`saving adventure keywords on ${adventureId}`)

      await this.adventureDB.updateSearchAdventureKeywords({
        keyword: searchString,
        adventureId
      })

      logger.info(`finished saving adventure keywords on ${adventureId}`)
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  handleAdventureSearch({ search }) {
    const parsedString = this.parseString(search)
    return this.adventureDB.searchDatabaseForAdventureString({
      search: parsedString
    })
  }
}

module.exports = SearchService
