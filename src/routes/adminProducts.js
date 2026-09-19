const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');
const { uploadBuffer, destroyImage } = require('../config/cloudinary');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();
router.use(adminAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }
    cb(null, true);
  },
});

// GET /api/admin/products — same as the public list, but included here too
// so the admin panel has one base URL to work against.
router.get('/', async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: 1 });
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products — create a new product (no image yet; upload
// one afterwards with POST /:id/image, or create with an image field
// already in the body if you uploaded first and have {url, publicId}).
router.post('/', async (req, res, next) => {
  try {
    const { id, name, cat, catLabel, price, badge, color, image } = req.body || {};

    if (!id || !name || !cat || !catLabel || price == null || !color) {
      return res.status(400).json({
        error: 'id, name, cat, catLabel, price and color are required.',
      });
    }

    const product = await Product.create({
      id,
      name,
      cat,
      catLabel,
      price,
      badge: badge || null,
      color,
      image: image && image.url ? { url: image.url, publicId: image.publicId || null } : undefined,
    });

    res.status(201).json({ product });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `A product with id "${req.body.id}" already exists.` });
    }
    next(err);
  }
});

// PUT /api/admin/products/:id — update product fields (not the image —
// use POST /:id/image for that, since it also has to talk to Cloudinary).
router.put('/:id', async (req, res, next) => {
  try {
    const { name, cat, catLabel, price, badge, color } = req.body || {};
    const update = {};
    if (name !== undefined) update.name = name;
    if (cat !== undefined) update.cat = cat;
    if (catLabel !== undefined) update.catLabel = catLabel;
    if (price !== undefined) update.price = price;
    if (badge !== undefined) update.badge = badge;
    if (color !== undefined) update.color = color;

    const product = await Product.findOneAndUpdate({ id: req.params.id }, update, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    res.json({ product });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products/:id/image — multipart/form-data, field name "image".
// Uploads the file to Cloudinary, deletes the product's previous image (if
// any) so old files don't pile up in your Cloudinary account, and saves
// the new { url, publicId } onto the product.
router.post('/:id/image', upload.single('image'), async (req, res, next) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded (expected field name "image").' });
    }

    const previousPublicId = product.image && product.image.publicId;

    const result = await uploadBuffer(req.file.buffer, { public_id: `${product.id}-${Date.now()}` });

    product.image = { url: result.secure_url, publicId: result.public_id };
    await product.save();

    if (previousPublicId) {
      destroyImage(previousPublicId).catch((err) =>
        console.error('Failed to delete old Cloudinary image:', err.message)
      );
    }

    res.json({ product });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/products/:id/image — remove the photo (product goes
// back to having no image) without deleting the whole product.
router.delete('/:id/image', async (req, res, next) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const publicId = product.image && product.image.publicId;
    product.image = { url: null, publicId: null };
    await product.save();

    if (publicId) {
      destroyImage(publicId).catch((err) =>
        console.error('Failed to delete Cloudinary image:', err.message)
      );
    }

    res.json({ product });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/products/:id — remove the product entirely, and its
// Cloudinary image with it.
router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.id });
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const publicId = product.image && product.image.publicId;
    if (publicId) {
      destroyImage(publicId).catch((err) =>
        console.error('Failed to delete Cloudinary image:', err.message)
      );
    }

    res.json({ product });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
