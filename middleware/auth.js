const jwt = require("jsonwebtoken");
const config = require('config')

const auth = async (req, res, next) => {

  const token = req.header('x-auth-token');

  // Check for token
  if (!token)
    return res.status(401).json({ msg: 'No token, authorizaton denied' });

  try {
    // Verify token
    const decoded = await jwt.verify(token, process.env.JWT_SECRET || config.get('jwtSecret'));

    // Add user from payload
    req.user = decoded;
    next();

  } catch (e) {
    res.status(400).json({ msg: 'Token is not valid' });
  }

};

// ROLES
const authRole = (roles) => (req, res, next) => {

  const token = req.header('x-auth-token');
  // Check for token
  if (!token)
    return res.status(401).json({ msg: 'No token, authorizaton denied' });

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET || config.get('jwtSecret'));

  // Add user from payload
  req.user = decoded;

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Session expired',
      code: 'SESSION_EXPIRED'
    });
  }

  let authorized = false;

  //if user has a role that is required to access any API
  roles.forEach(rol => {
    authorized = true;
    console.log(`${rol} Allowed!`)
  })

  if (authorized) {
    return next();
  }

  return res.status(401).json({
    success: false,
    msg: 'Unauthorized',
  })
}

module.exports = { auth, authRole };