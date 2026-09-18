/**
 * Live smoke test against a running backend (default http://localhost:4000).
 * Run: npm run smoke   (start the server first: npm run dev)
 */
const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:4000'

interface Check {
  name: string
  ok: boolean
  detail: string
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BASE}${path}`, init)
}

const checks: Check[] = []

function record(name: string, ok: boolean, detail: string): void {
  checks.push({ name, ok, detail })
}

const healthRes = await request('/health')
record('GET /health', healthRes.status === 200, `status ${healthRes.status}`)

const listRes = await request('/api/products')
const listBody = (await listRes.json()) as { count: number; products: Array<{ name: string; priceNum: number }> }
record(
  'GET /api/products returns 8 seed products',
  listRes.status === 200 && listBody.count === 8,
  `status ${listRes.status}, count ${listBody.count}`
)

const filterRes = await request('/api/products?fit=baggy&sort=price-asc')
const filterBody = (await filterRes.json()) as { count: number; products: Array<{ fit: string; priceNum: number }> }
const sorted = filterBody.products.every(
  (p, i, arr) => i === 0 || arr[i - 1].priceNum <= p.priceNum
)
record(
  'GET /api/products?fit=baggy&sort=price-asc',
  filterRes.status === 200 && filterBody.count === 2 && filterBody.products.every((p) => p.fit === 'Baggy') && sorted,
  `status ${filterRes.status}, count ${filterBody.count}, sorted ${sorted}`
)

const notFoundRes = await request('/api/products/999')
record('GET /api/products/999 → 404', notFoundRes.status === 404, `status ${notFoundRes.status}`)

const adminKey = process.env.ADMIN_API_KEY
const authHeader = adminKey ? { 'x-api-key': adminKey } : {}

const createRes = await request('/api/products', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...authHeader },
  body: JSON.stringify({
    name: 'Smoke Test Straight',
    fit: 'Straight',
    price: '₹999',
    priceNum: 999,
    img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
    desc: 'Created by the smoke script — safe to delete.',
    wash: 'Smoke Wash'
  })
})
const createBody = (await createRes.json()) as { product?: { id: number } }
record('POST /api/products → 201', createRes.status === 201, `status ${createRes.status}`)
const newId = createBody.product?.id

if (newId !== undefined) {
  const patchRes = await request(`/api/products/${newId}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', ...authHeader },
    body: JSON.stringify({ price: '₹1,099', priceNum: 1099 })
  })
  record('PUT /api/products/:id → 200', patchRes.status === 200, `status ${patchRes.status}`)

  const deleteRes = await request(`/api/products/${newId}`, {
    method: 'DELETE',
    headers: { ...authHeader }
  })
  record('DELETE /api/products/:id → 204', deleteRes.status === 204, `status ${deleteRes.status}`)
}

const orderRes = await request('/api/orders', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    orderNumber: `INF-SMOKE-${Date.now().toString().slice(-4)}`,
    customerName: 'Smoke Test Customer',
    customerPhone: '9876543210',
    customerEmail: 'smoke@example.com',
    address: '123 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    items: [{ id: 1, name: 'The Standard 01', size: '32', price: '₹1,499', priceNum: 1499, quantity: 1 }],
    subtotal: 1499,
    shipping: 0,
    total: 1499,
    handoffType: 'whatsapp'
  })
})
record('POST /api/orders → 201', orderRes.status === 201, `status ${orderRes.status}`)

const invalidRes = await request('/api/products', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...authHeader },
  body: JSON.stringify({ name: 'Broken' })
})
record('POST /api/products invalid body → 400', invalidRes.status === 400, `status ${invalidRes.status}`)

let failed = 0
for (const check of checks) {
  if (!check.ok) failed++
  console.log(`${check.ok ? '✓' : '✗'} ${check.name} (${check.detail})`)
}
console.log(failed === 0 ? '\nAll smoke checks passed.' : `\n${failed} smoke check(s) FAILED.`)
process.exitCode = failed === 0 ? 0 : 1
