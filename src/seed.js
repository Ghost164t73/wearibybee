// Seeds the product catalog into MongoDB if it's empty. Called once from
// server.js on startup — safe to run every time since it only inserts when
// the Products collection has zero documents.
//
// `image` starts empty — upload real photos for each product from the
// admin panel (/admin) once Cloudinary is configured, or PUT them in via
// PUT /api/admin/products/:id/image.

const Product = require('./models/Product');

const catalog = [
  { id: 'p1', name: 'Ivory Wrap Dress', cat: 'ready-to-wear', catLabel: 'Ready-to-wear', price: 85, badge: 'New', color: '#38243F' },
  { id: 'p2', name: 'Structured Two-Piece', cat: 'ready-to-wear', catLabel: 'Ready-to-wear', price: 95, badge: null, color: '#7A4FB0' },
  { id: 'p3', name: 'Tailored Kaftan', cat: 'bespoke', catLabel: 'Bespoke', price: 150, badge: 'Made to order', color: '#271A31' },
  { id: 'p4', name: 'Signature Agbada', cat: 'bespoke', catLabel: 'Bespoke', price: 220, badge: 'Made to order', color: '#4A2E52' },
  { id: 'p5', name: 'Ankara Wrap Set', cat: 'ready-to-wear', catLabel: 'Ready-to-wear', price: 70, badge: null, color: '#6B3FA0' },
  { id: 'p6', name: 'Silk Headwrap', cat: 'accessories', catLabel: 'Accessories', price: 25, badge: null, color: '#7A4FB0' },
];

async function seedDatabase() {
  const count = await Product.countDocuments();
  if (count > 0) return;

  await Product.insertMany(catalog);
  console.log(`Seeded ${catalog.length} products.`);
}

module.exports = seedDatabase;
