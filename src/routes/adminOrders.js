const express = require('express');
const Order = require('../models/Order');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();
router.use(adminAuth);

const STATUS_VALUES = ['pending', 'paid', 'fulfilled', 'cancelled'];

// GET /api/admin/orders?status=pending — list orders, newest first.
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/orders/:id/status   { status: "paid" }
// This is how an order gets marked as paid once you've confirmed the
// customer's bank transfer receipt on WhatsApp.
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!STATUS_VALUES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${STATUS_VALUES.join(', ')}.` });
    }

    const order = await Order.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    res.json({ order });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
