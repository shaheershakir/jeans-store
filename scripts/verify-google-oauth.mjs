/**
 * Diagnostic tool to verify Google OAuth 2.0 Client ID and Redirect URIs.
 * Tests each redirect URI against Google's authorization endpoint to detect redirect_uri_mismatch errors.
 */

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '777430238035-cl896fklpijq4cqlstm1d6h3s07q63ke.apps.googleusercontent.com'

const URIS_TO_CHECK = [
  'http://localhost:3000/auth/callback',
  'http://localhost:3001/auth/callback',
  'https://teesgarage.in/auth/callback',
  'https://www.teesgarage.in/auth/callback',
  'https://teesgarage-frontend-qsi3mphfka-el.a.run.app/auth/callback',
  'https://teesgarage-frontend-777430238035.asia-south1.run.app/auth/callback'
]

async function verifyUri(redirectUri) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', CLIENT_ID)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('prompt', 'select_account')

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'manual'
    })

    const location = res.headers.get('location') || ''
    if (location.includes('signin/oauth/error') || location.includes('redirect_uri_mismatch')) {
      return { uri: redirectUri, status: 'BLOCKED', reason: 'Error 400: redirect_uri_mismatch' }
    } else if (location.includes('v3/signin') || location.includes('ServiceLogin') || res.status === 200 || res.status === 302) {
      return { uri: redirectUri, status: 'AUTHORIZED', reason: 'Accepted by Google' }
    } else {
      return { uri: redirectUri, status: 'UNKNOWN', reason: `HTTP ${res.status}: ${location.slice(0, 100)}` }
    }
  } catch (err) {
    return { uri: redirectUri, status: 'ERROR', reason: err.message }
  }
}

async function main() {
  console.log(`\n======================================================`)
  console.log(` Google OAuth 2.0 Redirect URI Diagnostics`)
  console.log(` Client ID: ${CLIENT_ID}`)
  console.log(`======================================================\n`)

  for (const uri of URIS_TO_CHECK) {
    const result = await verifyUri(uri)
    const badge = result.status === 'AUTHORIZED' ? '[AUTHORIZED]' : '[BLOCKED]'
    console.log(`${badge.padEnd(14)} ${result.uri}`)
    if (result.status !== 'AUTHORIZED') {
      console.log(`               └─ ${result.reason}`)
    }
  }

  console.log(`\n------------------------------------------------------`)
  console.log(`To authorize blocked URLs, visit Google Cloud Console:`)
  console.log(`https://console.cloud.google.com/apis/credentials/oauthclient/${CLIENT_ID}?project=clothing-store-511300\n`)
}

main().catch(console.error)
