import { buildApp } from '../src/app.js'

async function run() {
  const app = buildApp({ logger: false })
  await app.ready()

  console.log('--- Running Authentication Integration Tests ---')

  // 1. Register a new user
  const email = `test_${Date.now()}@teesgaragejeans.com`
  const regRes = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: {
      name: 'Taylor Swift',
      email,
      password: 'StrongPassword123!'
    }
  })

  console.log(`Register status: ${regRes.statusCode}`)
  if (regRes.statusCode !== 201) {
    console.error('Register failed:', regRes.body)
    process.exit(1)
  }

  const regData = JSON.parse(regRes.body)
  console.log('Registered user:', regData.user)
  console.log('Cloud IAM token issued length:', regData.token.length)

  // 2. Duplicate registration check
  const dupRes = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: {
      name: 'Taylor Swift Duplicate',
      email,
      password: 'StrongPassword123!'
    }
  })
  console.log(`Duplicate register status: ${dupRes.statusCode} (expected 409)`)
  if (dupRes.statusCode !== 409) {
    console.error('Duplicate check failed')
    process.exit(1)
  }

  // 3. Login with correct credentials
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      email,
      password: 'StrongPassword123!'
    }
  })
  console.log(`Login status: ${loginRes.statusCode}`)
  if (loginRes.statusCode !== 200) {
    console.error('Login failed:', loginRes.body)
    process.exit(1)
  }
  const loginData = JSON.parse(loginRes.body)

  // 4. Login with incorrect password
  const badLoginRes = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      email,
      password: 'WrongPassword'
    }
  })
  console.log(`Bad login status: ${badLoginRes.statusCode} (expected 401)`)
  if (badLoginRes.statusCode !== 401) {
    console.error('Bad login check failed')
    process.exit(1)
  }

  // 5. Profile retrieval with Bearer token
  const meRes = await app.inject({
    method: 'GET',
    url: '/api/auth/me',
    headers: {
      Authorization: `Bearer ${loginData.token}`
    }
  })
  console.log(`Profile fetch status: ${meRes.statusCode}`)
  if (meRes.statusCode !== 200) {
    console.error('Profile fetch failed:', meRes.body)
    process.exit(1)
  }
  const meData = JSON.parse(meRes.body)
  console.log('Profile data:', meData.user)
  console.log('Cloud IAM claims:', meData.claims)

  // 6. Token verification utility
  const verifyRes = await app.inject({
    method: 'POST',
    url: '/api/auth/verify',
    payload: { token: loginData.token }
  })
  const verifyData = JSON.parse(verifyRes.body)
  console.log('Verify valid token:', verifyData.valid)

  const verifyBadRes = await app.inject({
    method: 'POST',
    url: '/api/auth/verify',
    payload: { token: 'bogus.jwt.token' }
  })
  const verifyBadData = JSON.parse(verifyBadRes.body)
  console.log('Verify bogus token:', verifyBadData.valid)

  console.log('\n✓ All Authentication Integration Tests Passed!')
  await app.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
