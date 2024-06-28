const jwt = require('jsonwebtoken')

class AuthService {
  constructor(jwtSecret) {
    this.jwtSecret = jwtSecret || 'secret'
  }

  issue(payload) {
    return jwt.sign(payload, this.jwtSecret)
  }
}

module.exports = AuthService
