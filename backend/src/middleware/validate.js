// Minimal body validator: ensures required fields are present.
// Usage: router.post('/', validate(['email', 'password']), handler)
function validate(requiredFields = []) {
  return (req, res, next) => {
    const body = req.body || {};
    const missing = requiredFields.filter(
      (f) => body[f] === undefined || body[f] === null || body[f] === ''
    );
    if (missing.length) {
      return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
    }
    next();
  };
}

module.exports = { validate };
