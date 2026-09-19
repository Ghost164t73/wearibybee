require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./src/config/db');
const seedDatabase = require('./src/seed');

const productsRouter = require('./src/routes/products');
const ordersRouter = require('./src/routes/orders');
const newsletterRouter = require('./src/routes/newsletter');
const adminProductsRouter = require('./src/routes/adminProducts');
const paymentInfoRouter = require('./src/routes/paymentInfo');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ---------- API ----------
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/payment-info', paymentInfoRouter);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// ---------- Admin panel ----------
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// ---------- Frontend (static) ----------
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------- Error handler (always last) ----------
app.use((err, req, res, next) => {
  // Multer (file size/type) and other client-input errors surface as plain
  // Error objects thrown before a real 500 happens — treat them as 400s.
  if (err && (err.name === 'MulterError' || /image files are allowed/i.test(err.message || ''))) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our end.' });
});

async function start() {
  try {
    await connectDB();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`Wearit by Bee API + site running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
