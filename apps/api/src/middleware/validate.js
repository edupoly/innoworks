import mongoose from 'mongoose';

export const validateObjectId = (req, res, next) => {
  const ids = { ...req.params, ...req.query, ...req.body };
  
  for (const key in ids) {
    if (key.toLowerCase().endsWith('id') || key === '_id') {
      if (!mongoose.Types.ObjectId.isValid(ids[key])) {
        return res.status(400).json({ message: `Invalid ID format for ${key}` });
      }
    }
  }
  next();
};

export const validate = (schema) => (req, res, next) => {
  // Simple validation logic or use a library like Joi/Zod
  // For now, we'll just check for required fields if needed
  next();
};
