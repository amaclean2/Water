const jwt = require('jsonwebtoken')

const { isExempt } = require('./utils/handlers')

class AuthService {
  constructor(jwtSecret) {
    this.jwtSecret = jwtSecret || 'secret'
  }

  issue(payload) {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '48h' })
  }

  validate({ originalUrl, token }) {
    return new Promise((resolve, reject) => {
      if (originalUrl && isExempt(originalUrl)) {
        resolve(true)
      }

      if (token === undefined || token === 'undefined') {
        reject(`there was no autorization token provided for ${originalUrl}`)
      } else {
        jwt.verify(token, this.jwtSecret, {}, (error, decoded) => {
          error && reject(error)

          resolve({ idFromToken: decoded.id })
        })
      }
    })
  }
}

module.exports = AuthService
