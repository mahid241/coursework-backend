// server.js


require('dotenv').config(); // Load environment variables from .env file
const express = require('express'); // Express web server
const cors = require('cors'); // Handle Cross-Origin requests
const { MongoClient, ObjectId } = require('mongodb'); // MongoDB tools


const app = express();
app.use(cors()); // Enable CORS for all origins (frontend can reach backend)
app.use(express.json()); // Support JSON bodies in API requests


// Simple request logger: prints every incoming request to console (for assessment)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});


// Serve static images: anything in /images can be loaded by browser
app.use('/images', express.static('images'));


const uri = process.env.MONGODB_URI; // MongoDB connection string from .env
const port = process.env.PORT || 3000; // Use port from environment or default to 3000


// Check for MongoDB URI when starting
if (!uri) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1); // Stop server if missing
}


const client = new MongoClient(uri);
let db, lessonsCol, ordersCol; // Will hold our database and collection references


// Connect to MongoDB (runs on server start)
async function start() {
  try {
    await client.connect();
    db = client.db('courseworkfullstack'); // Change to match your database name in the URI
    lessonsCol = db.collection('lessons');
    ordersCol = db.collection('orders');


    console.log('Connected to MongoDB Atlas');


    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1); // Stop server if connection fails
  }
}
start();


// Health check endpoint (just returns 'OK' if server is working)
app.get('/', (_req, res) => {
  res.send('OK');
});


// Info route describing this backend service
app.get('/api/info', (_req, res) => {
  res.json({
    name: 'After School Lessons API',
    version: '1.0.0',
    description: 'Provides lessons and order endpoints for the Vue frontend.'
  });
});


// GET all lessons from the database
app.get('/lessons', async (_req, res) => {
  try {
    const docs = await lessonsCol.find({}).toArray(); // Get all lessons

    // Map MongoDB '_id' to 'id' expected by frontend, with safe defaults
    const mapped = docs.map(d => ({
      id: d._id?.toString(),
      topic: d.topic || '',
      location: d.location || '',
      price: d.price ?? 0,
      spaces: d.spaces ?? 0,
      image: d.image || ''
    }));


    res.json(mapped); // Send mapped lessons to frontend
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});


// POST create an order in database
app.post('/orders', async (req, res) => {
  try {
    const { name, phone, lessonIDs, spaces } = req.body;
    if (!name || !phone || !Array.isArray(lessonIDs) || !spaces) {
      return res.status(400).json({ error: 'Invalid order payload' });
    }


    // Convert lessonIDs to MongoDB ObjectIds
    const lessonObjectIds = lessonIDs
      .filter(Boolean)
      .map(id => {
        try { return new ObjectId(id); } catch { return null; }
      })
      .filter(v => v);


    // Store the order in the database
    const result = await ordersCol.insertOne({
      name,
      phone,
      lessonIDs: lessonObjectIds,
      spaces,
      createdAt: new Date()
    });


    res.status(201).json({ insertedId: result.insertedId }); // Return new order's id
  } catch (e) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});


// PUT update a lesson by its id (for spaces or other updates)
app.put('/lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let oid;
    try {
      oid = new ObjectId(id);
    } catch {
      return res.status(400).json({ error: 'Invalid lesson id' });
    }


    const update = req.body; // { spaces: 3 }, or any field


    // Validate update payload is a non-empty object
    if (!update || typeof update !== 'object' || Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'Invalid update payload' });
    }


    // Update lesson record in database
    const result = await lessonsCol.updateOne({ _id: oid }, { $set: update });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json({ modifiedCount: result.modifiedCount }); // Return how many updated
  } catch (e) {
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});
