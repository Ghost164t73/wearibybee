const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    cat: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: null },
    address: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // "ord_<uuid>"
    items: { type: [lineItemSchema], required: true },
    subtotal: { type: Number, required: true },
    customer: { type: customerSchema, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'fulfilled', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

orderSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Order', orderSchema);
