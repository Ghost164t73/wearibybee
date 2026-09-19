const express = require('express');
const Subscriber = require('../models/Subscriber');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/newsletter/subscribe  { email }
router.post('/subscribe', async (req, res, next) => {
  try {
    const email = req.body && req.body.email;
    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const normalized = email.trim().toLowerCase();
    const existing = await Subscriber.findOne({ email: normalized });

    if (existing) {
      return res.status(200).json({ message: "You're already on the list." });
    }

    await Subscriber.create({ email: normalized });

    res.status(201).json({ message: "You're on the list. Watch your inbox for new arrivals." });
  } catch (err) {
    // A duplicate-key race (two requests at once) should read the same as
    // "already subscribed", not a 500.
    if (err && err.code === 11000) {
      return res.status(200).json({ message: "You're already on the list." });
    }
    next(err);
  }
});

module.exports = router;
