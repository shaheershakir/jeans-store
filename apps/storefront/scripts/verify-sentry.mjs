import pkg from '@sentry/nextjs'
const { init, captureException, flush } = pkg

init({
  dsn: 'https://877d0aa41054671d270bf2d7f93c7c9d@o4509651505905664.ingest.us.sentry.io/4512273758814208',
  environment: 'development',
  debug: true,
})

console.log('Sending Sentry verification exception...')
const eventId = captureException(new Error('Sentry Onboarding Verification: TEESGARAGE Storefront Connected'))
console.log('Captured event ID:', eventId)

const flushed = await flush(5000)
console.log('Flushed successfully:', flushed)
