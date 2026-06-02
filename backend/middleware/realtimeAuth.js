import jwt from 'jsonwebtoken';
import User from '../modules/auth/models/User.js';

export const authenticateRealtime = async (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token;

  if (!token) {
    res.status(401).end();
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name email role employeeType isActive');

    if (!user || user.isActive === false) {
      res.status(401).end();
      return null;
    }

    return user;
  } catch {
    res.status(401).end();
    return null;
  }
};

