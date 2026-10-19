import 'dotenv/config'
import http from 'node:http'
import { buildApp } from '../src/app.js'

async function main() {
  const app = buildApp({ enableLogging: false })
  const server = http.createServer(app)

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve())
  })

  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0
  const base = `http://127.0.0.1:${port}`

  async function request(path: string, init?: RequestInit) {
    const res = await fetch(`${base}${path}`, init)
    let body: any = null
    try {
      body = await res.json()
    } catch {
      body = null
    }
    return { status: res.status, body }
  }

  const fail = (message: string): never => {
    console.error(`❌ ${message}`)
    process.exit(1)
  }

  try {
    console.log('--- Running Authentication Integration Tests ---')

    const email = `test_${Date.now()}@teesgaragejeans.com`

    const reg = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Taylor Swift', email, password: 'StrongPassword123!' })
    })
    console.log(`Register status: ${reg.status}`)
    if (reg.status !== 201) fail(`Register failed: ${JSON.stringify(reg.body)}`)
    console.log('Registered user:', reg.body.user)
    console.log('Token length:', reg.body.token.length)

    const dup = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Taylor Swift Duplicate', email, password: 'StrongPassword123!' })
    })
    console.log(`Duplicate register status: ${dup.status} (expected 409)`)
    if (dup.status !== 409) fail('Duplicate registration was not rejected.')

    const login = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'StrongPassword123!' })
    })
    console.log(`Login status: ${login.status}`)
    if (login.status !== 200) fail(`Login failed: ${JSON.stringify(login.body)}`)
    const token = login.body.token as string

    const badLogin = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'WrongPassword' })
    })
    console.log(`Bad login status: ${badLogin.status} (expected 401)`)
    if (badLogin.status !== 401) fail('Bad login was not rejected.')

    const me = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log(`Profile fetch status: ${me.status}`)
    if (me.status !== 200) fail(`Profile fetch failed: ${JSON.stringify(me.body)}`)
    console.log('Profile data:', me.body.user)

    const verify = await request('/api/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token })
    })
    console.log('Verify valid token:', verify.body.valid)
    if (verify.body.valid !== true) fail('Valid token was not verified.')

    const verifyBad = await request('/api/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'bogus.jwt.token' })
    })
    console.log('Verify bogus token:', verifyBad.body.valid)
    if (verifyBad.body.valid !== false) fail('Bogus token was accepted.')

    console.log('\n✓ All Authentication Integration Tests Passed!')
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
