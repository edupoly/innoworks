import { AuditLog } from '../models/AuditLog.js';

/**
 * Roles hierarchy and their default permissions
 */
export const ROLES = {
  ADMIN: 'Admin',
  PROJECT_OWNER: 'Project Owner',
  TEAM: 'Team',
  DEVELOPER: 'Developer'
};

const ROLE_RANK = {
  [ROLES.ADMIN]: 4,
  [ROLES.PROJECT_OWNER]: 3,
  [ROLES.TEAM]: 2,
  [ROLES.DEVELOPER]: 1
};

/**
 * Middleware to check if user has the required role or higher
 */
export const authorize = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Access denied. Role not identified." });
    }

    const userRoleRank = ROLE_RANK[req.user.role] || 0;
    const requiredRoleRank = ROLE_RANK[requiredRole] || 0;

    if (userRoleRank >= requiredRoleRank) {
      return next();
    }

    return res.status(403).json({ message: `Access denied. ${requiredRole} role required.` });
  };
};

/**
 * Middleware to check for specific permissions
 */
export const hasPermission = (permission) => {
  return (req, res, next) => {
    if (req.user && req.user.role === ROLES.ADMIN) {
      return next();
    }

    const permissions = req.user?.permissions || [];
    if (req.user && permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({ message: "Access denied. Insufficient permissions." });
  };
};

/**
 * Helper to mask sensitive data
 */
export const maskSensitiveData = (user, viewer) => {
  const userData = user.toObject ? user.toObject() : { ...user };
  
  // If viewer is Admin, return full data
  if (viewer && viewer.role === ROLES.ADMIN) {
    return userData;
  }

  // Mask Email: ex******@gmail.com
  if (userData.email) {
    const [name, domain] = userData.email.split('@');
    if (name.length > 2) {
      userData.email = `${name.substring(0, 2)}******@${domain}`;
    } else {
      userData.email = `******@${domain}`;
    }
  }

  // Mask Phone: 987******10
  if (userData.phone) {
    const p = userData.phone;
    if (p.length > 5) {
      userData.phone = `${p.substring(0, 3)}******${p.substring(p.length - 2)}`;
    } else {
      userData.phone = `******${p.substring(p.length - 1)}`;
    }
  }

  return userData;
};

/**
 * Helper to log audit actions
 */
export const logAudit = async (req, action, resource, resourceId, metadata = {}) => {
  try {
    await AuditLog.create({
      action,
      actor: req.user.userId,
      resource,
      resourceId,
      metadata,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (error) {
    console.error("❌ Audit Logging Failed:", error.message);
  }
};
