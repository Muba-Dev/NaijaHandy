const DEV_FALLBACK_SECRET = 'artisanng-dev-secret-key-change-in-production'

// Never silently fall back to a hardcoded secret in production — a public,
// predictable secret would let anyone forge JWTs.
export const JWT_SECRET: string =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'production'
    ? (() => {
        throw new Error('JWT_SECRET must be set when NODE_ENV=production')
      })()
    : DEV_FALLBACK_SECRET)
