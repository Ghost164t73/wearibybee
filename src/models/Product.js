const mongoose = require('mongoose');

// Keeps the same shape the frontend and old JSON db already used —
// `id` (e.g. "p1") stays the public-facing identifier instead of Mongo's
// ObjectId, so routes don't need to change.
//
// `icon` (an SVG lookup key) has been replaced by `image`: a real photo
// hosted on Cloudinary. `publicId` is kept alongside the URL (Cloudinary's
// public IDs aren't secret) so the admin panel can ask Cloudinary to
// delete or replace the old image when a product's photo changes.
const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    cat: {
      type: String,
      required: true,
      enum: ['bespoke', 'ready-to-wear', 'accessories'],
    },
    catLabel: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    badge: { type: String, default: null },
    color: { type: String, required: true },
  },
  { timestamps: true }
);

// Hide Mongo internals from API responses so the JSON shape matches what
// the frontend already expects.
productSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Product', productSchema);
