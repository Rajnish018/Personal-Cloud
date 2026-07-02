import User from "../models/user.model.js";

/**
 * Calculate the storage usage percentage for a user.
 * Returns an object { used, limit, percent }.
 */
export const calculateUsage = async (userId) => {
  const user = await User.findById(userId).select("storageUsed storageLimit");
  if (!user) throw new Error("User not found");
  const used = user.storageUsed || 0;
  const limit = user.storageLimit || 0;
  const percent = limit > 0 ? (used / limit) * 100 : 0;
  return { used, limit, percent };
};

/**
 * Increment a user's storage usage by `size` bytes.
 */
export const incrementUsage = async (userId, size) => {
  if (size <= 0) return;
  const result = await User.updateOne(
    { _id: userId },
    { $inc: { storageUsed: size } }
  );
  if (result.nModified === 0) throw new Error("Failed to increment storage usage");
};

/**
 * Decrement a user's storage usage by `size` bytes.
 */
export const decrementUsage = async (userId, size) => {
  if (size <= 0) return;
  const result = await User.updateOne(
    { _id: userId, storageUsed: { $gte: size } },
    { $inc: { storageUsed: -size } }
  );
  if (result.nModified === 0) throw new Error("Failed to decrement storage usage");
};
