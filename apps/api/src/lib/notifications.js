import { Notification } from '../models/Notification.js';
import { io } from '../index.js';

/**
 * Send a notification to a specific user.
 * It persists the notification to MongoDB and broadcasts it in real-time via Socket.IO if the user is connected.
 * 
 * @param {string} userId - Target user ID (ObjectId or string)
 * @param {string} type - Notification type (e.g., 'PR_CREATED', 'REVIEW_ADDED', 'ACHIEVEMENT_UNLOCKED')
 * @param {string} message - User-facing notification text
 * @param {string} [link] - Optional destination URL/route on the frontend
 */
export const sendNotification = async (userId, type, message, link = '') => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      message,
      link,
      read: false
    });

    if (io) {
      // Emit to the user's private Socket.IO room
      io.to(userId.toString()).emit('notification', {
        _id: notification._id,
        type: notification.type,
        message: notification.message,
        link: notification.link,
        read: notification.read,
        createdAt: notification.createdAt
      });
      console.log(`📡 Real-time notification emitted to room ${userId}: "${message}"`);
    } else {
      console.warn('⚠️ Socket.IO not initialized. Skipping real-time broadcast.');
    }

    return notification;
  } catch (error) {
    console.error('❌ Error sending notification:', error.message);
  }
};
