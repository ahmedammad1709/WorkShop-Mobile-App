// Simple in-memory rate limiting. For production, use Redis.
const emailRequests = new Map();
const ipRequests = new Map();

function withinWindow(records, windowMs) {
  const cutoff = Date.now() - windowMs;
  while (records.length && records[0] < cutoff) records.shift();
  return records;
}

export function otpRequestLimiter(req, res, next) {
  const maxPerHour = Number(process.env.MAX_OTP_REQUESTS_PER_HOUR || 5);
  const keyEmail = (req.body?.email || '').toLowerCase();
  const ip = req.ip;

  const now = Date.now();
  const windowMs = 60 * 60 * 1000;

  if (keyEmail) {
    const rec = emailRequests.get(keyEmail) || [];
    withinWindow(rec, windowMs);
    if (rec.length >= maxPerHour) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests for this email. Please try later.' });
    }
    rec.push(now);
    emailRequests.set(keyEmail, rec);
  }

  const recIp = ipRequests.get(ip) || [];
  withinWindow(recIp, windowMs);
  if (recIp.length >= maxPerHour * 5) {
    return res.status(429).json({ success: false, message: 'Too many requests from this IP. Please try later.' });
  }
  recIp.push(now);
  ipRequests.set(ip, recIp);

  next();
}


