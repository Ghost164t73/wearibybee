// Mongoose connection. Replaces the old file-backed src/db.js.
//
// Requires MONGODB_URI in the environment — see .env.example.
// For local dev: mongodb://127.0.0.1:27017/wearit-by-bee
// For Atlas:     mongodb+srv://<user>:<pass>@<cluster>/wearit-by-bee

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Copy .env.example to .env and fill it in.'
    );
  }

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected:', mongoose.connection.name);
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });

  await mongoose.connect(uri);
}

module.exports = connectDB;
