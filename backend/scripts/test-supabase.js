require('dotenv').config({ path: './config/config.env' });
const supabase = require('../utils/supabaseClient');

(async () => {
  const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'community-photos';
  const TEST_PATH = `uploads/test-upload-${Date.now()}.txt`;
  const content = Buffer.from('supabase upload test');
  try {
    console.log('Attempting upload to', BUCKET, TEST_PATH);
    const { data, error } = await supabase.storage.from(BUCKET).upload(TEST_PATH, content, {
      contentType: 'text/plain',
      upsert: false
    });
    if (error) {
      console.error('Upload error:', error);
    } else {
      console.log('Upload success:', data);

      const { data: signedData, error: signedError } = await supabase.storage.from(BUCKET).createSignedUrl(TEST_PATH, 3600);
      if (signedError) {
        console.error('Signed URL error:', signedError);
      } else {
        console.log('Signed URL:', signedData.signedUrl);
      }
    }
  } catch (err) {
    console.error('Unexpected exception:', err);
  }
})();
