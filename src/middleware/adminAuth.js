// Minimal protection for the admin API: requires an x-admin-key header
// matching ADMIN_API_KEY. Good enough to keep product writes and image
// uploads from being wide open on the internet; swap for real auth
// (sessions, JWT, etc.) before this goes anywhere near production.

function adminAuth(req, res, next) {
  const key = process.env.ADMIN_API_KEY;

  if (!key) {
    return res.status(500).json({
      error: 'ADMIN_API_KEY is not set on the server — admin routes are disabled until it is.',
    });
  }

  if (req.header('x-admin-key') !== key) {
    return res.status(401).json({ error: 'Missing or invalid admin key.' });
  }

  next();
}

module.exports = adminAuth;
