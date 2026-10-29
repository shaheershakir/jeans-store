import pkg from '@sentry/nextjs'
const { init, captureException, flush } = pkg

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
if (!dsn) {
  console.error('Error: NEXT_PUBLIC_SENTRY_DSN or SENTRY_DSN environment variable must be set.')
  process.exit(1)
}

init({
  dsn,
  environment: 'development',
  debug: true,
})

console.log('Sending Sentry verification exception...')
const eventId = captureException(new Error('Sentry Onboarding Verification: TEESGARAGE Storefront Connected'))
console.log('Captured event ID:', eventId)

const flushed = await flush(5000)
console.log('Flushed successfully:', flushed)
