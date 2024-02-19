// JWT.js

const { sign, verify } = require('jsonwebtoken');

const SECRET_KEY = 'amplamarecelmaizeufemeilemoare'; // Înlocuiește cu cheia ta secretă reală

const createTokens = (user) => {
  const accessToken = sign({ email: user.email, id: user.id }, SECRET_KEY);
  console.log("Access token: " + accessToken)
  return accessToken;
};

const validateToken = (req, res, next) => {
  const accessToken = req.headers.authorization.split(' ')[1]; // Modificare aici pentru a accesa token-ul din headers
  if (!accessToken) return res.status(400).json({ error: 'User not authenticated' });
  try {
    const validToken = verify(accessToken, SECRET_KEY);
    if (validToken) {
      req.authenticated = true;
      return next();
    }
  } catch (err) {
    console.log('Error validating token:', err);
    return res.status(400).json({ error: err.message });
  }
};



module.exports = { createTokens, validateToken};
