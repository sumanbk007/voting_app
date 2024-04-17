const jwt = require("jsonwebtoken");

const jwtAuthMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({ error: "Token not found" });
  }

  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    //Verify token

    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    //Attached user information into request object

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

//Generate token

const generateToken = (userData) => {
  return jwt.sign(userData, process.env.SECRET_KEY, { expiresIn: 3000000 });
};

module.exports = { jwtAuthMiddleware, generateToken };
