/*
Migration script: migrate existing Community.topic string names to Topic ObjectIds.

Usage:
  node migrate-topics-to-ids.js --dry-run
  node migrate-topics-to-ids.js

Notes:
- Requires backend/config/config.env with MONGO_URI set (same as server).
- The script will:
  1) Ensure all topic names present in communities exist as Topic documents (create if missing).
  2) Replace Community.topics arrays of names with arrays of Topic ObjectIds.
  3) Offers a `--dry-run` flag to preview changes without writing.
  4) Logs a JSON backup file `migrate-topics-backup-<timestamp>.json` before mutating.
*/

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

const Community = require('../models/Community');
const Topic = require('../models/Topic');

const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('-d');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in config.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  const communities = await Community.find({}).lean();
  console.log(`Found ${communities.length} communities`);

  const backupFile = path.join(process.cwd(), `migrate-topics-backup-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(communities, null, 2));
  console.log(`Wrote backup to ${backupFile}`);

  // Collect all unique topic strings from communities (only strings)
  const topicNames = new Set();
  for (const c of communities) {
    if (Array.isArray(c.topics)) {
      for (const t of c.topics) {
        if (t && typeof t === 'string' && !/^[0-9a-fA-F]{24}$/.test(t)) {
          topicNames.add(t.trim());
        }
      }
    }
  }

  console.log(`Found ${topicNames.size} unique string topic names to ensure in Topic collection`);

  const nameToId = {};

  // Ensure Topic docs exist for these names
  for (const name of topicNames) {
    let topic = await Topic.findOne({ name });
    if (!topic) {
      console.log(`Creating Topic: ${name}`);
      if (!DRY_RUN) topic = await Topic.create({ name });
    }
    nameToId[name] = topic ? String(topic._id) : null;
  }

  // Now update communities
  for (const c of communities) {
    const originalTopics = c.topics || [];
    const newTopicIds = [];
    for (const t of originalTopics) {
      if (!t) continue;
      if (typeof t === 'string') {
        if (/^[0-9a-fA-F]{24}$/.test(t)) {
          newTopicIds.push(t);
        } else {
          const id = nameToId[t.trim()];
          if (id) newTopicIds.push(id);
          else console.warn(`No Topic id found for name "${t}"`);
        }
      } else if (typeof t === 'object' && t._id) {
        newTopicIds.push(String(t._id));
      }
    }

    // Compare
    const equal = originalTopics.length === newTopicIds.length && originalTopics.every((ot, i) => {
      const nv = newTopicIds[i];
      if (!nv) return false;
      if (typeof ot === 'string' && /^[0-9a-fA-F]{24}$/.test(ot)) return ot === nv;
      return true; // if original was name we consider it changed
    });

    if (!equal) {
      console.log(`Community ${c._id} - topics will change: ${JSON.stringify(originalTopics)} -> ${JSON.stringify(newTopicIds)}`);
      if (!DRY_RUN) {
        await Community.updateOne({ _id: c._id }, { $set: { topics: newTopicIds } });
      }
    }
  }

  console.log('Migration complete');
  mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
