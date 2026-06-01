import jwt from "jsonwebtoken";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authentication required: No token provided" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Authentication required: Malformed token header" });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.userId) {
      throw new Error("Invalid token payload: missing userId");
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ JWT Verification Error:", error.message);
    return res.status(401).json({ 
      message: `Authentication required: ${error.message === 'jwt expired' ? 'Token expired' : 'Invalid token'}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
