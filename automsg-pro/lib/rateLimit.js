const rateLimitStore = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;

function cleanupExpired(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record) return;
  const valid = record.filter(t => now - t < WINDOW_MS);
  if (valid.length === 0) {
    rateLimitStore.delete(ip);
  } else {
    rateLimitStore.set(ip, valid);
  }
}

export function checkRateLimit(ip) {
  cleanupExpired(ip);
  const record = rateLimitStore.get(ip) || [];
  const now = Date.now();
  const windowRequests = record.filter(t => now - t < WINDOW_MS);
  
  if (windowRequests.length >= MAX_REQUESTS) {
    return false;
  }
  
  windowRequests.push(now);
  rateLimitStore.set(ip, windowRequests);
  return true;
}

export function getRateLimitInfo(ip) {
  cleanupExpired(ip);
  const record = rateLimitStore.get(ip) || [];
  const now = Date.now();
  const windowRequests = record.filter(t => now - t < WINDOW_MS);
  const remaining = MAX_REQUESTS - windowRequests.length;
  const resetIn = Math.ceil((record[0] || now) + WINDOW_MS - now) / 1000;
  
  return {
    limit: MAX_REQUESTS,
    remaining: Math.max(0, remaining),
    resetIn: Math.max(0, resetIn),
  };
}