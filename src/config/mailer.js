// Sends the shop owner an email whenever a new order comes in. Since this
// store has no online payment gateway, this email — plus the receipt the
// customer sends on WhatsApp — is how orders actually get confirmed.
//
// Requires SMTP_HOST, SMTP_USER, SMTP_PASS and ADMIN_EMAIL in .env. If any
// of those are missing, sendOrderNotification() just logs a warning and
// skips silently — a missing email setup should never break checkout.

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      'SMTP env vars are missing — order notification emails are disabled until ' +
        'SMTP_HOST, SMTP_USER and SMTP_PASS are set in .env.'
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE === 'true', // true for port 465, false for 587/25
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

function formatOrderEmail(order) {
  const itemLines = order.items.map((i) => `  - ${i.name} x${i.qty} — ₦${i.lineTotal}`).join('\n');
  const itemRows = order.items
    .map((i) => `<tr><td style="padding:4px 10px 4px 0">${i.name}</td><td style="padding:4px 10px">x${i.qty}</td><td style="padding:4px 0">₦${i.lineTotal}</td></tr>`)
    .join('');

  const text = `New order ${order.id}

Customer: ${order.customer.name}
Email: ${order.customer.email}
Phone: ${order.customer.phone || '—'}
Address: ${order.customer.address || '—'}
Notes: ${order.customer.notes || '—'}

Items:
${itemLines}

Subtotal: ₦${order.subtotal}
Status: ${order.status}
Placed: ${order.createdAt}

Payment: bank transfer — the customer has been asked to send their receipt
on WhatsApp. Confirm it there before marking this order as paid.`;

  const html = `
    <h2 style="font-family:sans-serif">New order ${order.id}</h2>
    <p style="font-family:sans-serif"><strong>Customer:</strong> ${order.customer.name} (${order.customer.email})</p>
    <p style="font-family:sans-serif"><strong>Phone:</strong> ${order.customer.phone || '—'}</p>
    <p style="font-family:sans-serif"><strong>Address:</strong> ${order.customer.address || '—'}</p>
    ${order.customer.notes ? `<p style="font-family:sans-serif"><strong>Notes:</strong> ${order.customer.notes}</p>` : ''}
    <table style="font-family:sans-serif; border-collapse:collapse">${itemRows}</table>
    <p style="font-family:sans-serif"><strong>Subtotal:</strong> ₦${order.subtotal}</p>
    <p style="font-family:sans-serif"><strong>Status:</strong> ${order.status}</p>
    <p style="font-family:sans-serif; color:#7A4FB0">
      Bank transfer order — the customer has been asked to send their payment
      receipt on WhatsApp. Confirm it there before marking this order as paid.
    </p>
  `;

  return { text, html };
}

async function sendOrderNotification(order) {
  const t = getTransporter();
  if (!t) return;

  const { EMAIL_FROM, SMTP_USER, ADMIN_EMAIL } = process.env;
  if (!ADMIN_EMAIL) {
    console.warn('ADMIN_EMAIL is not set — skipping order notification email.');
    return;
  }

  const { text, html } = formatOrderEmail(order);

  await t.sendMail({
    from: EMAIL_FROM || SMTP_USER,
    to: ADMIN_EMAIL,
    subject: `New order ${order.id} — ${order.customer.name} (₦${order.subtotal})`,
    text,
    html,
  });
}

module.exports = { sendOrderNotification };
