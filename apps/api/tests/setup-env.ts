import 'dotenv/config'

/**
 * Hard safety gate for the API test suite.
 *
 * The application `.env` points at a shared Neon database. Test files create,
 * update and archive catalogue rows, so running them against that database is
 * destructive. Tests must opt in to a disposable database with
 * TEST_DATABASE_URL; the regular DATABASE_URL is removed before any test module
 * (and therefore before @jeans-store/db) is imported.
 *
 * Local hosts are allowed by default. A remote test database (for example a
 * branch database in CI) requires ALLOW_REMOTE_TEST_DB=true.
 */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'postgres', 'db', 'host.docker.internal'])

function hostOf(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname.toLowerCase()
  } catch {
    return null
  }
}

function normalize(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl)
    parsed.password = ''
    return parsed.toString()
  } catch {
    return rawUrl
  }
}

const applicationUrl = process.env.DATABASE_URL?.trim() ?? ''
const testUrl = process.env.TEST_DATABASE_URL?.trim() ?? ''

if (testUrl) {
  if (applicationUrl && normalize(testUrl) === normalize(applicationUrl)) {
    throw new Error(
      'TEST_DATABASE_URL must not point at the application DATABASE_URL. Tests write catalogue and order data.'
    )
  }
  const host = hostOf(testUrl)
  if (!host || (!LOCAL_HOSTS.has(host) && process.env.ALLOW_REMOTE_TEST_DB !== 'true')) {
    throw new Error(
      `Refusing to run tests against remote database host "${host ?? 'invalid'}". ` +
        'Use a local database or set ALLOW_REMOTE_TEST_DB=true for a disposable remote test database.'
    )
  }
  process.env.DATABASE_URL = testUrl
} else {
  // Never inherit the application database. DB-gated suites skip instead.
  delete process.env.DATABASE_URL
}

export const testDatabaseEnabled = Boolean(process.env.DATABASE_URL)

// Payment tests exercise signature verification and the checkout contract, not
// the live Razorpay API. Give them deterministic test credentials so the suite
// behaves the same locally and on a clean CI checkout with no `.env` file.
process.env.RAZORPAY_KEY_ID ||= 'rzp_test_ci000000000000'
process.env.RAZORPAY_KEY_SECRET ||= 'ci_razorpay_test_secret'
process.env.RAZORPAY_WEBHOOK_SECRET ||= 'ci_razorpay_webhook_secret'
