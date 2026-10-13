import 'dotenv/config'
import request from 'supertest'
import crypto from 'node:crypto'
import { buildApp } from './src/app.js'
import { razorpayService } from './src/services/razorpay.js'
import { orderStore } from './src/store/orderStore.js'

async function runPaymentReview() {
  console.log('====================================================')
  console.log('   TEESGARAGE PAYMENT & CHECKOUT SCRATCHPAD REVIEW  ')
  console.log('====================================================\n')

  const app = buildApp({ enableLogging: false })

  // 1. Check Razorpay Service & Config
  console.log('▶ STEP 1: Inspecting Razorpay Credentials & Status')
  const keyId = razorpayService.getKeyId()
  const keySecret = razorpayService.getKeySecret()
  const status = razorpayService.getStatus()

  console.log('  Razorpay Key ID:', keyId ? `${keyId.slice(0, 10)}... (Present: ${Boolean(keyId)})` : 'Missing')
  console.log('  Razorpay Key Secret:', keySecret ? `Present (${keySecret.length} chars)` : 'Missing')
  console.log('  Service Enabled:', status.enabled)

  // 2. Test Direct Razorpay API
  console.log('\n▶ STEP 2: Testing Live Razorpay API Connectivity (paise conversion & order creation)')
  let liveRazorpayOrder = null
  try {
    liveRazorpayOrder = await razorpayService.createOrder({
      amount: 149900, // ₹1499.00 in paise
      currency: 'INR',
      receipt: `SCRATCH-${Date.now().toString().slice(-6)}`,
      notes: { channel: 'scratchpad-test', customer: 'Review Agent' }
    })
    console.log('  ✓ Direct Razorpay order created successfully!')
    console.log('    Order ID:', liveRazorpayOrder.id)
    console.log('    Amount:', liveRazorpayOrder.amount, 'paise (₹' + liveRazorpayOrder.amount / 100 + ')')
    console.log('    Status:', liveRazorpayOrder.status)
  } catch (err) {
    console.error('  ✗ Direct Razorpay order creation failed:', err.message)
  }

  // 3. Test CORS for Port 3002 (Storefront default when 3000 is occupied)
  console.log('\n▶ STEP 3: Testing CORS Preflight Handling for Development Ports (3000, 3001, 3002)')
  for (const origin of ['http://localhost:3002', 'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3002']) {
    const corsRes = await request(app)
      .options('/api/orders/razorpay/create-order')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type')

    const allowedOrigin = corsRes.headers['access-control-allow-origin']
    const isAllowed = allowedOrigin === origin || allowedOrigin === '*'
    console.log(`  Origin: ${origin.padEnd(25)} -> Status: ${corsRes.status} | Allow-Origin: ${allowedOrigin} | Allowed: ${isAllowed ? '✓' : '✗'}`)
  }

  // 4. Test API GET /api/orders/razorpay/config
  console.log('\n▶ STEP 4: Testing GET /api/orders/razorpay/config')
  const configRes = await request(app).get('/api/orders/razorpay/config')
  console.log('  Status:', configRes.status)
  console.log('  Response:', JSON.stringify(configRes.body))

  // 5. Test API POST /api/orders/razorpay/create-order
  console.log('\n▶ STEP 5: Testing POST /api/orders/razorpay/create-order via App Route')
  const orderNum = `TGE-TEST-${Date.now().toString().slice(-6)}`
  const createRes = await request(app)
    .post('/api/orders/razorpay/create-order')
    .set('Origin', 'http://localhost:3002')
    .send({
      amount: 1999,
      currency: 'INR',
      orderNumber: orderNum,
      customerName: 'Aarav Patel',
      customerEmail: 'aarav@teesgarage.in',
      customerPhone: '9876543210'
    })

  console.log('  Status:', createRes.status)
  console.log('  Response:', JSON.stringify(createRes.body))
  const createdRzpOrderId = createRes.body?.razorpayOrderId

  // 6. Test Signature Verification and POST /api/orders/razorpay/verify
  console.log('\n▶ STEP 6: Testing Payment Verification & DB Persistence (POST /api/orders/razorpay/verify)')
  if (createdRzpOrderId) {
    const fakePaymentId = `pay_mock_${Date.now()}`
    const expectedSig = crypto
      .createHmac('sha256', keySecret)
      .update(`${createdRzpOrderId}|${fakePaymentId}`)
      .digest('hex')

    const orderPayload = {
      orderNumber: orderNum,
      store: 'teesgarage',
      customerName: 'Aarav Patel',
      customerPhone: '9876543210',
      customerEmail: 'aarav@teesgarage.in',
      address: 'Flat 402, Sea Green Apts, Worli',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400018',
      items: [
        {
          id: 1,
          name: 'Classic Straight Indigo',
          fit: 'Straight',
          size: '32',
          price: '₹1,999',
          priceNum: 1999,
          quantity: 1
        }
      ],
      subtotal: 1999,
      shipping: 0,
      total: 1999,
      handoffType: 'razorpay'
    }

    const verifyRes = await request(app)
      .post('/api/orders/razorpay/verify')
      .set('Origin', 'http://localhost:3002')
      .send({
        razorpay_order_id: createdRzpOrderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: expectedSig,
        order: orderPayload
      })

    console.log('  Status:', verifyRes.status)
    console.log('  Success:', verifyRes.body?.success)
    console.log('  Saved Order Number:', verifyRes.body?.order?.orderNumber)
    console.log('  Saved Order Status:', verifyRes.body?.order?.status)
    console.log('  Payment ID Recorded:', verifyRes.body?.paymentId)

    // Check query from store
    const retrieved = await orderStore.getByOrderNumber(orderNum)
    console.log('  Retrieved from Database / Store:', retrieved ? `✓ Found (status: ${retrieved.status})` : '✗ Not found')
  }

  // 7. Test Cash on Delivery POST /api/orders
  console.log('\n▶ STEP 7: Testing Cash on Delivery (POST /api/orders)')
  const codOrderNum = `COD-TEST-${Date.now().toString().slice(-6)}`
  const codRes = await request(app)
    .post('/api/orders')
    .set('Origin', 'http://localhost:3002')
    .send({
      orderNumber: codOrderNum,
      store: 'teesgarage',
      customerName: 'Priya Sharma',
      customerPhone: '9123456789',
      customerEmail: 'priya@teesgarage.in',
      address: 'Plot 12, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      items: [
        {
          id: 2,
          name: 'Relaxed Indigo Selvedge',
          fit: 'Relaxed',
          size: '30',
          price: '₹1,499',
          priceNum: 1499,
          quantity: 1
        }
      ],
      subtotal: 1499,
      shipping: 0,
      total: 1499,
      handoffType: 'cod',
      status: 'pending'
    })

  console.log('  Status:', codRes.status)
  console.log('  Saved COD Order:', codRes.body?.order?.orderNumber, '| Status:', codRes.body?.order?.status)

  console.log('\n====================================================')
  console.log('   SCRATCHPAD PAYMENT REVIEW COMPLETED SUCCESSFULLY ')
  console.log('====================================================')
}

runPaymentReview().catch((err) => {
  console.error('Fatal Scratchpad Error:', err)
  process.exit(1)
})
