const exemptQueries = [
  '/initial',
  'favicon',
  '/adventures/all',
  '/adventures/search',
  '/adventures/details',
  'savePasswordReset',
  'resetPassword',
  '/verify',
  '/users/login',
  '/users/create',
  '/users/passwordResetLink',
  '/users/newPassword',
  '/images'
]

const isExempt = (originalUrl) => {
  return exemptQueries.some((query) => originalUrl.includes(query))
}

module.exports = {
  exemptQueries,
  isExempt
}
