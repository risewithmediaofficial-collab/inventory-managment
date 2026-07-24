import Notification from './model.js';
import { getPagination, buildPaginationMeta } from '../../utils/apiResponse.js';
import mongoose from 'mongoose';

export const getNotifications = async (query, companyId, userId) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { companyId, $or: [{ isGlobal: true }, { recipients: userId }] };
  if (query.unread === 'true') filter['readBy.user'] = { $ne: new mongoose.Types.ObjectId(userId) };

  const [data, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
  ]);

  const unreadCount = await Notification.countDocuments({
    ...filter, 'readBy.user': { $ne: new mongoose.Types.ObjectId(userId) },
  });

  return { data, pagination: buildPaginationMeta(total, page, limit), unreadCount };
};

export const markAsRead = async (id, userId, companyId) => {
  return Notification.findOneAndUpdate(
    { _id: id, companyId },
    { $addToSet: { readBy: { user: userId, readAt: new Date() } } },
    { new: true }
  );
};

export const markAllAsRead = async (userId, companyId) => {
  const notifications = await Notification.find({
    companyId, $or: [{ isGlobal: true }, { recipients: userId }],
    'readBy.user': { $ne: new mongoose.Types.ObjectId(userId) },
  });

  for (const notif of notifications) {
    notif.readBy.push({ user: userId, readAt: new Date() });
    await notif.save();
  }
  return { marked: notifications.length };
};

export const createNotification = async (data, companyId, userId) => {
  return Notification.create({ ...data, companyId, createdBy: userId });
};

export const deleteNotification = async (id, companyId) => {
  return Notification.findOneAndDelete({ _id: id, companyId });
};
