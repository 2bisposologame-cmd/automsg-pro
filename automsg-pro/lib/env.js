const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const OPTIONAL_ENV_VARS = [
  'GEMINI_API_KEY',
];

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  return true;
}

export function getEnv(key, defaultValue = null) {
  return process.env[key] || defaultValue;
}

export function getRequiredEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required env var ${key} is not set`);
  }
  return value;
}

export { REQUIRED_ENV_VARS, OPTIONAL_ENV_VARS };