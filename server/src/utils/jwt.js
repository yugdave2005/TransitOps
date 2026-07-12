const jwt = require('jsonwebtoken');
const config = require('../config/env');

function signToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = {
  signToken,
  verifyToken
};
