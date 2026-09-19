const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// GET /api/products?category=bespoke
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = !category || category === 'all' ? {} : { cat: category };
    const products = await Product.find(filter).sort({ createdAt: 1 });
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
