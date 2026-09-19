const express = require('express');
const router = express.Router();

// GET /api/payment-info
// Bank account + WhatsApp number shown to the customer at checkout, since
// this store takes payment by bank transfer instead of a card gateway.
router.get('/', (req, res) => {
  const { BANK_NAME, BANK_ACCOUNT_NAME, BANK_ACCOUNT_NUMBER, WHATSAPP_NUMBER } = process.env;

  if (!BANK_NAME || !BANK_ACCOUNT_NAME || !BANK_ACCOUNT_NUMBER || !WHATSAPP_NUMBER) {
    return res.status(503).json({
      error: 'Payment details are not configured on the server yet.',
    });
  }

  res.json({
    bankName: BANK_NAME,
    accountName: BANK_ACCOUNT_NAME,
    accountNumber: BANK_ACCOUNT_NUMBER,
    whatsappNumber: WHATSAPP_NUMBER, // E.164 digits only, e.g. 2348012345678
  });
});

module.exports = router;
