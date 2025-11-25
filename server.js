// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

// simple request logger (required by brief)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// serve static images (required by brief)
app.use('/images', express.static('images'));

const uri = process.env.MONGODB_URI;
const port = process.env.PORT || 3000;

if (!uri) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

const client = new MongoClient(uri);
let db, lessonsCol, ordersCol;

// connect once, then reuse the connection
async function start() {
  try {
    await client.connect();
    // use your DB name here; it must match the DB segment in your URI path
    db = client.db('courseworkfullstack');
    lessonsCol = db.collection('lessons');
    ordersCol = db.collection('orders');

    console.log('Connected to MongoDB Atlas');

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}
start();

// Health check
app.get('/', (_req, res) => {
  res.send('OK');
});

// GET all lessons
app.get('/lessons', async (_req, res) => {
  try {
    const docs = await lessonsCol.find({}).toArray();

    // Optional mapping if your frontend expects "id" instead of MongoDB "_id"
    const mapped = docs.map(d => ({
      id: d._id?.toString(),
      topic: d.topic,
      location: d.location,
      price: d.price,
      spaces: d.spaces,
      image: d.image
    }));

    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// POST create an order
app.post('/orders', async (req, res) => {
  try {
    const { name, phone, lessonIDs, spaces } = req.body;
    if (!name || !phone || !Array.isArray(lessonIDs) || !spaces) {
      return res.status(400).json({ error: 'Invalid order payload' });
    }

    // Store lessonIDs as ObjectIds if they are valid
    const lessonObjectIds = lessonIDs
      .filter(Boolean)
      .map(id => {
        try { return new ObjectId(id); } catch { return null; }
      })
      .filter(v => v);

    const result = await ordersCol.insertOne({
      name,
      phone,
      lessonIDs: lessonObjectIds,
      spaces,
      createdAt: new Date()
    });

    res.status(201).json({ insertedId: result.insertedId });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT update a lesson by id (any attribute, not just +/- spaces)
app.put('/lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let oid;
    try {
      oid = new ObjectId(id);
    } catch {
      return res.status(400).json({ error: 'Invalid lesson id' });
    }

    const update = req.body;
    if (!update || typeof update !== 'object') {
      return res.status(400).json({ error: 'Invalid update payload' });
    }

    const result = await lessonsCol.updateOne({ _id: oid }, { $set: update });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json({ modifiedCount: result.modifiedCount });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});
