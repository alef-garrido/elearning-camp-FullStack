const supabase = require('./supabaseClient');

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
const EXPIRY_SECONDS = 365 * 24 * 60 * 60; // 1 year

/**
 * Generate a signed URL for a photo stored in Supabase
 * @param {string} filename - The filename (stored in community.photo)
 * @returns {Promise<string|null>} The signed URL or null if filename doesn't exist
 */
async function getPhotoUrl(filename) {
  if (!filename) {
    return null;
  }

  try {
    const storagePath = `uploads/${filename}`;
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, EXPIRY_SECONDS);

    if (error) {
      console.warn(`[getPhotoUrl] Failed to generate signed URL for ${filename}:`, error.message);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('[getPhotoUrl] Unexpected error:', err);
    return null;
  }
}

/**
 * Enhance a community object with a photoUrl field
 * @param {Object} community - Community object (or array of communities)
 * @returns {Promise<Object>} Community object with photoUrl field added
 */
async function enhanceCommunityWithPhotoUrl(community) {
  if (!community) {
    return community;
  }

  // Handle array of communities
  if (Array.isArray(community)) {
    return Promise.all(community.map(c => enhanceCommunityWithPhotoUrl(c)));
  }

  // Convert to plain object if it's a Mongoose document
  const communityObj = community.toObject ? community.toObject() : community;

  // Generate signed URL if photo filename exists
  if (communityObj.photo) {
    communityObj.photoUrl = await getPhotoUrl(communityObj.photo);
  } else {
    communityObj.photoUrl = null;
  }

  return communityObj;
}

module.exports = {
  getPhotoUrl,
  enhanceCommunityWithPhotoUrl
};
