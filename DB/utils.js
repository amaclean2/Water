const logger = require('../Config/logger')

const formatShortUser = (user) => {
  const shortUserProperties = [
    'user_id',
    'display_name',
    'first_name',
    'email',
    'profile_picture_url'
  ]

  const hasAllProperties = shortUserProperties.every((property) => {
    if (Object.keys(user).includes(property)) {
      return true
    } else {
      return false
    }
  })

  if (!hasAllProperties) {
    throw 'database query failed to include all short user properties'
  }

  return {
    user_id: user.user_id,
    display_name: user.display_name,
    first_name: user.first_name,
    email: user.email,
    profile_picture_url: user.profile_picture_url
  }
}

const failedInsertion = async (error) => {
  logger.error('DATABASE_INSERTION_FAILED')
  logger.error(error)
  throw error
}

const failedQuery = async (error) => {
  logger.error('DATABASE_QUERY_FAILED')
  logger.error(error)
  throw error
}

const failedUpdate = async (error) => {
  logger.error('DATABASE_UPDATE_FAILED')
  logger.error(error)
  throw error
}

const failedDeletion = async (error) => {
  logger.info('DATABASE_DELETION_FAILED')
  logger.error(error)
  throw error
}

module.exports = {
  formatShortUser,
  failedInsertion,
  failedQuery,
  failedUpdate,
  failedDeletion
}
