const express = require('express');
const crypto = require('crypto');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { sendOrderNotification } = require('../config/mailer');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCustomer(customer) {
  if (!customer || typeof customer !== 'object') {
    return 'Customer details are required.';
  }
  if (!customer.name || typeof customer.name !== 'string' || !customer.name.trim()) {
    return 'Please enter your name.';
  }
  if (!customer.email || typeof customer.email !== 'string' || !EMAIL_RE.test(customer.email.trim())) {
    return 'Please enter a valid email address.';
  }
  if (!customer.phone || typeof customer.phone !== 'string' || !customer.phone.trim()) {
    return 'Please enter your phone number.';
  }
  if (!customer.address || typeof customer.address !== 'string' || !customer.address.trim()) {
    return 'Please enter your delivery address.';
  }
  return null;
}

// POST /api/orders  { items: [{id, qty}], customer: {name, email, phone, address, notes?} }
router.post('/', async (req, res, next) => {
  try {
    const { items, customer } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your bag is empty.' });
    }

    const customerError = validateCustomer(customer);
    if (customerError) return res.status(400).json({ error: customerError });

    const lineItems = [];

    // Prices always come from the server's catalog, never the client —
    // look each product up individually rather than trusting req.body.
    for (const raw of items) {
      const id = raw && raw.id;
      const qty = raw && raw.qty;
      if (typeof id !== 'string' || !Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ error: 'One of the items in your bag is invalid.' });
      }
      const product = await Product.findOne({ id });
      if (!product) {
        return res.status(400).json({ error: `Product "${id}" no longer exists.` });
      }
      lineItems.push({
        id: product.id,
        name: product.name,
        cat: product.cat,
        price: product.price,
        qty,
        lineTotal: Math.round(product.price * qty * 100) / 100,
      });
    }

    const subtotal = Math.round(lineItems.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;

    const order = await Order.create({
      id: 'ord_' + crypto.randomUUID(),
      items: lineItems,
      subtotal,
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone ? String(customer.phone).trim() : null,
        address: customer.address ? String(customer.address).trim() : null,
        notes: customer.notes ? String(customer.notes).trim() : null,
      },
      status: 'pending',
    });

    res.status(201).json({ order });

    // Fire-and-forget: a failed or unconfigured mail setup should never
    // fail the order itself — the response above has already gone out.
    sendOrderNotification(order.toJSON()).catch((err) =>
      console.error('Failed to send order notification email:', err.message)
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id — used for an order confirmation lookup
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
