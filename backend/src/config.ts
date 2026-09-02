const isProduction = process.env.NODE_ENV === 'production'

const DEV_FALLBACK_SECRET = 'artisanng-dev-secret-key-change-in-production'
export { DEV_FALLBACK_SECRET }

// Never silently fall back to a hardcoded secret in production — a public,
// predictable secret would let anyone forge JWTs.
export const JWT_SECRET: string =
  process.env.JWT_SECRET ||
  (isProduction
    ? (() => {
        throw new Error('JWT_SECRET must be set when NODE_ENV=production')
      })()
    : DEV_FALLBACK_SECRET)

// Origin of the Next.js app — used for CORS, email links and payment redirects.
// Function so tests can override the env var after module load.
export const FRONTEND_URL = (): string =>
  process.env.FRONTEND_URL || 'http://localhost:3000'

// PORT from env or default, then overridden by a `--port N` CLI argument
// (e.g. `npm run dev -- --port 5000`). CLI wins over env for local convenience.
const cliPortArg = process.argv.find((a) => a.startsWith('--port='))
  ?.split('=')[1]
  ?? process.argv[process.argv.indexOf('--port') + 1]
const CLI_PORT = cliPortArg ? Number(cliPortArg) : Number.NaN

export const PORT = Number.isInteger(CLI_PORT) && CLI_PORT > 0 ? CLI_PORT : Number(process.env.PORT) || 4000

export const HTTP = {
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 1000 : 100,
  },
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '6mb',
}

export const PAYSTACK = {
  secretKey: () => process.env.PAYSTACK_SECRET_KEY || '',
  baseUrl: () => process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
  callbackUrl: () => process.env.PAYSTACK_CALLBACK_URL || `${FRONTEND_URL()}/bookings`,
  mock: () => process.env.PAYSTACK_MOCK === 'true' || !process.env.PAYSTACK_SECRET_KEY,
}

export const GOOGLE = {
  clientId: () => process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: () => process.env.GOOGLE_CLIENT_SECRET || '',
}