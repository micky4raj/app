import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import Razorpay from 'razorpay'
import crypto from 'node:crypto'

const uri = process.env.MONGO_URL
const dbName = process.env.DB_NAME || 'jigyasa_fabrics'

let cachedClient = null
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(uri)
    await cachedClient.connect()
  }
  return cachedClient.db(dbName)
}

// Razorpay client (server-only)
let rzp = null
function getRzp() {
  if (!rzp) {
    rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return rzp
}

// ---------- SEED DATA ----------
const SEED_PRODUCTS = [
  {
    name: 'Royal Maroon Banarasi Silk Saree',
    category: 'Saree',
    fabric: 'Banarasi Silk',
    unit: 'piece',
    price: 4499,
    mrp: 8999,
    image: 'https://images.unsplash.com/photo-1679006831648-7c9ea12e5807?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHxzYXJlZXxlbnwwfHx8fDE3ODg1ODE0OTl8MA&ixlib=rb-4.1.0&q=85',
    gsm: 220,
    weave: 'Jacquard',
    stock: 24,
    rating: 4.6,
    ratingCount: 1284,
    colors: ['Maroon', 'Gold'],
    description: 'Traditional handwoven Banarasi silk saree with intricate zari work. Comes with unstitched blouse piece.',
    bestSeller: true,
  },
  {
    name: 'Pink Rose Chiffon Designer Saree',
    category: 'Saree',
    fabric: 'Chiffon',
    unit: 'piece',
    price: 1799,
    mrp: 3499,
    image: 'https://images.unsplash.com/photo-1727430228383-aa1fb59db8bf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwyfHxzYXJlZXxlbnwwfHx8fDE3ODg1ODE0OTl8MA&ixlib=rb-4.1.0&q=85',
    gsm: 90,
    weave: 'Plain',
    stock: 42,
    rating: 4.3,
    ratingCount: 587,
    colors: ['Pink', 'Rose'],
    description: 'Lightweight chiffon saree with sequin border. Perfect for daytime functions.',
  },
  {
    name: 'Emerald Green Kanjivaram Silk Saree',
    category: 'Saree',
    fabric: 'Kanjivaram Silk',
    unit: 'piece',
    price: 6299,
    mrp: 11999,
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwzfHxzYXJlZXxlbnwwfHx8fDE3ODg1ODE0OTl8MA&ixlib=rb-4.1.0&q=85',
    gsm: 260,
    weave: 'Kanjivaram',
    stock: 12,
    rating: 4.8,
    ratingCount: 342,
    colors: ['Green', 'Gold'],
    description: 'Pure South Indian Kanjivaram silk with rich pallu and temple border.',
    bestSeller: true,
  },
  {
    name: 'Red Bridal Embroidered Saree',
    category: 'Saree',
    fabric: 'Silk',
    unit: 'piece',
    price: 8999,
    mrp: 15999,
    image: 'https://images.unsplash.com/photo-1618901185975-d59f7091bcfe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHxzYXJlZXxlbnwwfHx8fDE3ODg1ODE0OTl8MA&ixlib=rb-4.1.0&q=85',
    gsm: 240,
    weave: 'Embroidered',
    stock: 8,
    rating: 4.9,
    ratingCount: 210,
    colors: ['Red', 'Gold'],
    description: 'Handcrafted bridal saree with all-over embroidery and stone work.',
  },
  {
    name: 'Ivory Cotton Unstitched Suit Set (3-piece)',
    category: 'Suit Set',
    fabric: 'Cotton',
    unit: 'set',
    price: 1199,
    mrp: 2499,
    image: 'https://images.unsplash.com/photo-1616756351484-798f37bdffa0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwyfHxpbmRpYW4lMjBmYWJyaWN8ZW58MHx8fHwxNzg4NTgxNDk5fDA&ixlib=rb-4.1.0&q=85',
    gsm: 140,
    weave: 'Plain',
    stock: 60,
    rating: 4.4,
    ratingCount: 923,
    colors: ['Ivory'],
    description: 'Premium cotton suit set — 2.5m top + 2.5m bottom + 2.25m dupatta. Unstitched.',
    bestSeller: true,
  },
  {
    name: 'Mustard Yellow Chanderi Suit Set',
    category: 'Suit Set',
    fabric: 'Chanderi',
    unit: 'set',
    price: 1899,
    mrp: 3799,
    image: 'https://images.unsplash.com/photo-1616756141603-6d37d5cde2a2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmYWJyaWN8ZW58MHx8fHwxNzg4NTgxNDk5fDA&ixlib=rb-4.1.0&q=85',
    gsm: 130,
    weave: 'Chanderi',
    stock: 30,
    rating: 4.5,
    ratingCount: 456,
    colors: ['Yellow'],
    description: 'Elegant chanderi silk-cotton blend suit set with printed dupatta.',
  },
  {
    name: 'Multi-Color Cotton Print Fabric',
    category: 'Cotton Fabric',
    fabric: 'Cotton',
    unit: 'meter',
    price: 249,
    mrp: 399,
    image: 'https://images.unsplash.com/photo-1669556289350-0e2480fe190e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHw0fHxpbmRpYW4lMjBmYWJyaWN8ZW58MHx8fHwxNzg4NTgxNDk5fDA&ixlib=rb-4.1.0&q=85',
    gsm: 120,
    weave: 'Printed',
    stock: 500,
    rating: 4.2,
    ratingCount: 1892,
    colors: ['Multi'],
    description: 'Vibrant multi-color printed cotton, sold per meter. Perfect for kurtas & dresses.',
    bestSeller: true,
  },
  {
    name: 'Rainbow Georgette Fabric Roll',
    category: 'Silk Fabric',
    fabric: 'Georgette',
    unit: 'meter',
    price: 349,
    mrp: 599,
    image: 'https://images.unsplash.com/photo-1624516268152-1e48624026ed?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwyfHx0ZXh0aWxlJTIwY29sb3JmdWx8ZW58MHx8fHwxNzg4NTgxNTA0fDA&ixlib=rb-4.1.0&q=85',
    gsm: 80,
    weave: 'Georgette',
    stock: 320,
    rating: 4.3,
    ratingCount: 741,
    colors: ['Rainbow'],
    description: 'Soft flowing georgette in vibrant rainbow shades. Sold per meter.',
  },
  {
    name: 'Turquoise Silk Blend Fabric',
    category: 'Silk Fabric',
    fabric: 'Silk Blend',
    unit: 'meter',
    price: 499,
    mrp: 899,
    image: 'https://images.unsplash.com/photo-1655149238677-9b5cb1a0afc6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwzfHx0ZXh0aWxlJTIwY29sb3JmdWx8ZW58MHx8fHwxNzg4NTgxNTA0fDA&ixlib=rb-4.1.0&q=85',
    gsm: 110,
    weave: 'Satin',
    stock: 180,
    rating: 4.6,
    ratingCount: 512,
    colors: ['Turquoise'],
    description: 'Luxurious silk-blend satin fabric with lustrous finish. Sold per meter.',
  },
  {
    name: 'Traditional Block-Print Cotton',
    category: 'Cotton Fabric',
    fabric: 'Cotton',
    unit: 'meter',
    price: 199,
    mrp: 349,
    image: 'https://images.unsplash.com/photo-1601056639638-c53c50e13ead?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHx0ZXh0aWxlJTIwY29sb3JmdWx8ZW58MHx8fHwxNzg4NTgxNTA0fDA&ixlib=rb-4.1.0&q=85',
    gsm: 130,
    weave: 'Block-Print',
    stock: 420,
    rating: 4.5,
    ratingCount: 2103,
    colors: ['Blue', 'White'],
    description: 'Hand block-printed pure cotton from Jaipur. Sustainable & breathable.',
    bestSeller: true,
  },
]

async function ensureSeed(db) {
  const count = await db.collection('products').countDocuments()
  if (count === 0) {
    const docs = SEED_PRODUCTS.map(p => ({
      id: uuidv4(),
      ...p,
      createdAt: new Date(),
    }))
    await db.collection('products').insertMany(docs)
  }
}

// ---------- ROUTE HANDLERS ----------
async function handler(request, ctx) {
  const params = await ctx.params
  const path = (params?.path || []).join('/')
  const method = request.method

  try {
    // ==== RAZORPAY WEBHOOK (must use raw body BEFORE any parse) ====
    if (method === 'POST' && path === 'razorpay/webhook') {
      const raw = Buffer.from(await request.arrayBuffer())
      const received = request.headers.get('x-razorpay-signature') || ''
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || ''
      const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex')
      const valid = expected.length === received.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))
      if (!valid) return new NextResponse('Invalid signature', { status: 400 })

      const event = JSON.parse(raw.toString('utf8'))
      const eventId = request.headers.get('x-razorpay-event-id') || event.id
      const db = await getDb()

      // Idempotency
      const existing = await db.collection('orders').findOne({ webhookEvents: eventId })
      if (existing) return NextResponse.json({ received: true })

      if (event.event === 'payment.captured') {
        const entity = event.payload?.payment?.entity
        if (entity?.order_id) {
          await db.collection('orders').updateOne(
            { razorpayOrderId: entity.order_id },
            {
              $set: {
                status: 'confirmed',
                'payment.status': 'captured',
                'payment.razorpayPaymentId': entity.id,
                updatedAt: new Date(),
              },
              $addToSet: { webhookEvents: eventId },
            }
          )
        }
      } else if (event.event === 'payment.failed') {
        const entity = event.payload?.payment?.entity
        if (entity?.order_id) {
          await db.collection('orders').updateOne(
            { razorpayOrderId: entity.order_id },
            {
              $set: { 'payment.status': 'failed', updatedAt: new Date() },
              $addToSet: { webhookEvents: eventId },
            }
          )
        }
      }
      return NextResponse.json({ received: true })
    }
    const db = await getDb()
    await ensureSeed(db)

    // =========== EMERGENT GOOGLE AUTH ===========
    // POST /api/auth/session   Body: { session_id }
    // Exchanges session_id for user profile via Emergent, stores session, sets cookie.
    if (method === 'POST' && path === 'auth/session') {
      const { session_id } = await request.json()
      if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

      const emergentRes = await fetch(
        'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
        { headers: { 'X-Session-ID': session_id } }
      )
      if (!emergentRes.ok) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      }
      const profile = await emergentRes.json()
      // profile: { id, email, name, picture, session_token }

      const userId = profile.id || profile.email
      const now = new Date()
      await db.collection('users').updateOne(
        { id: userId },
        {
          $set: {
            id: userId,
            email: profile.email,
            name: profile.name,
            picture: profile.picture,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      )

      const sessionToken = profile.session_token || session_id
      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000)
      await db.collection('sessions').updateOne(
        { token: sessionToken },
        {
          $set: {
            token: sessionToken,
            userId,
            user: { id: userId, email: profile.email, name: profile.name, picture: profile.picture },
            expiresAt,
          },
        },
        { upsert: true }
      )

      const res = NextResponse.json({ ok: true, user: { id: userId, email: profile.email, name: profile.name, picture: profile.picture } })
      res.cookies.set('jf_session', sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 3600,
      })
      return res
    }

    // GET /api/auth/me
    if (method === 'GET' && path === 'auth/me') {
      const token = request.cookies.get('jf_session')?.value
      if (!token) return NextResponse.json({ user: null })
      const sess = await db.collection('sessions').findOne({ token }, { projection: { _id: 0 } })
      if (!sess || new Date(sess.expiresAt) < new Date()) {
        return NextResponse.json({ user: null })
      }
      return NextResponse.json({ user: sess.user })
    }

    // POST /api/auth/logout
    if (method === 'POST' && path === 'auth/logout') {
      const token = request.cookies.get('jf_session')?.value
      if (token) await db.collection('sessions').deleteOne({ token })
      const res = NextResponse.json({ ok: true })
      res.cookies.set('jf_session', '', { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 0 })
      return res
    }

    // GET /api/auth/orders  (logged-in user's orders)
    if (method === 'GET' && path === 'auth/orders') {
      const token = request.cookies.get('jf_session')?.value
      if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const sess = await db.collection('sessions').findOne({ token })
      if (!sess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const orders = await db.collection('orders')
        .find({ 'address.userEmail': sess.user.email }, { projection: { _id: 0 } })
        .sort({ createdAt: -1 }).limit(50).toArray()
      return NextResponse.json({ orders })
    }

    // =========== RAZORPAY ===========
    // POST /api/razorpay/create-order  { items: [{id, qty}], address }
    // Server calculates authoritative amount from DB products and creates Razorpay order.
    if (method === 'POST' && path === 'razorpay/create-order') {
      const body = await request.json()
      const { items = [] } = body
      if (!items.length) return NextResponse.json({ error: 'No items' }, { status: 400 })

      // Fetch authoritative product prices from DB
      const ids = items.map(i => i.id)
      const products = await db.collection('products').find({ id: { $in: ids } }, { projection: { _id: 0 } }).toArray()
      const priceMap = Object.fromEntries(products.map(p => [p.id, p]))

      let subtotal = 0
      const validated = []
      for (const it of items) {
        const p = priceMap[it.id]
        if (!p) return NextResponse.json({ error: `Product ${it.id} not found` }, { status: 400 })
        const qty = Math.max(1, Number(it.qty) || 1)
        subtotal += p.price * qty
        validated.push({ id: p.id, name: p.name, price: p.price, mrp: p.mrp, image: p.image, unit: p.unit, qty })
      }
      const shipping = subtotal > 999 ? 0 : 79
      const tax = Math.round(subtotal * 0.05)
      const total = subtotal + shipping + tax
      const amountPaise = total * 100

      const receipt = 'rcpt_' + uuidv4().replaceAll('-', '').slice(0, 20)
      const rzpOrder = await getRzp().orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt,
        notes: { source: 'jigyasa_fabrics' },
      })

      return NextResponse.json({
        ok: true,
        orderId: rzpOrder.id,
        amount: amountPaise,
        currency: 'INR',
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        receipt,
        breakdown: { items: validated, subtotal, shipping, tax, total },
      })
    }

    // POST /api/razorpay/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature, address, breakdown }
    // Verifies HMAC and, on success, creates the order in our DB.
    if (method === 'POST' && path === 'razorpay/verify') {
      const body = await request.json()
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, address, breakdown } = body
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ error: 'Incomplete payment response' }, { status: 400 })
      }
      const message = `${razorpay_order_id}|${razorpay_payment_id}`
      const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(message).digest('hex')
      const valid = expected.length === razorpay_signature.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature))
      if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })

      // Re-validate breakdown from DB to prevent tampering
      const items = breakdown?.items || []
      const ids = items.map(i => i.id)
      const products = await db.collection('products').find({ id: { $in: ids } }, { projection: { _id: 0 } }).toArray()
      const priceMap = Object.fromEntries(products.map(p => [p.id, p]))
      let subtotal = 0
      for (const it of items) {
        const p = priceMap[it.id]
        if (!p) return NextResponse.json({ error: 'Product changed' }, { status: 400 })
        subtotal += p.price * Math.max(1, Number(it.qty) || 1)
      }
      const shipping = subtotal > 999 ? 0 : 79
      const tax = Math.round(subtotal * 0.05)
      const total = subtotal + shipping + tax

      const order = {
        id: uuidv4(),
        orderNumber: 'JF' + Date.now().toString().slice(-8),
        items,
        address,
        payment: {
          method: 'RAZORPAY',
          status: 'paid',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        },
        razorpayOrderId: razorpay_order_id,
        subtotal, shipping, tax, total,
        status: 'confirmed',
        awb: 'AWB' + Math.floor(1e9 + Math.random() * 9e9),
        trackingUrl: 'https://shiprocket.co/tracking/',
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      }
      await db.collection('orders').insertOne({ ...order })
      return NextResponse.json({ ok: true, order })
    }

    // GET /api/products
    if (method === 'GET' && path === 'products') {
      const url = new URL(request.url)
      const category = url.searchParams.get('category')
      const search = url.searchParams.get('search')
      const minPrice = parseInt(url.searchParams.get('minPrice') || '0')
      const maxPrice = parseInt(url.searchParams.get('maxPrice') || '999999')
      const sort = url.searchParams.get('sort') || 'popular'

      const q = { price: { $gte: minPrice, $lte: maxPrice } }
      if (category && category !== 'All') q.category = category
      if (search) q.name = { $regex: search, $options: 'i' }

      let cursor = db.collection('products').find(q, { projection: { _id: 0 } })
      if (sort === 'price_low') cursor = cursor.sort({ price: 1 })
      else if (sort === 'price_high') cursor = cursor.sort({ price: -1 })
      else if (sort === 'rating') cursor = cursor.sort({ rating: -1 })
      else cursor = cursor.sort({ ratingCount: -1 })

      const products = await cursor.toArray()
      return NextResponse.json({ products })
    }

    // GET /api/products/:id
    if (method === 'GET' && path.startsWith('products/')) {
      const id = path.split('/')[1]
      const p = await db.collection('products').findOne({ id }, { projection: { _id: 0 } })
      if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ product: p })
    }

    // POST /api/pincode-check  { pincode }
    if (method === 'POST' && path === 'pincode-check') {
      const { pincode } = await request.json()
      const p = String(pincode || '').trim()
      if (!/^[1-9][0-9]{5}$/.test(p)) {
        return NextResponse.json({ ok: false, message: 'Enter a valid 6-digit pincode' })
      }
      // Simple heuristic: metros faster
      const metros = ['110', '400', '560', '600', '700', '500', '380', '411']
      const isMetro = metros.some(m => p.startsWith(m))
      const days = isMetro ? '2-3' : '4-6'
      return NextResponse.json({
        ok: true,
        serviceable: true,
        pincode: p,
        etaDays: days,
        codAvailable: !p.startsWith('19'), // silly example
        message: `Delivers to ${p} in ${days} business days`,
      })
    }

    // POST /api/orders  { items, address, payment }
    if (method === 'POST' && path === 'orders') {
      const body = await request.json()
      const { items = [], address = {}, payment = {}, subtotal = 0, shipping = 0, tax = 0, total = 0 } = body
      if (!items.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      if (!address.name || !address.phone || !address.pincode || !address.line1) {
        return NextResponse.json({ error: 'Address incomplete' }, { status: 400 })
      }
      const order = {
        id: uuidv4(),
        orderNumber: 'JF' + Date.now().toString().slice(-8),
        items,
        address,
        payment: { method: payment.method || 'COD', status: payment.method === 'COD' ? 'pending' : 'paid' },
        subtotal, shipping, tax, total,
        status: 'confirmed',
        awb: 'AWB' + Math.floor(1e9 + Math.random() * 9e9),
        trackingUrl: 'https://shiprocket.co/tracking/',
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      }
      await db.collection('orders').insertOne({ ...order })
      return NextResponse.json({ ok: true, order })
    }

    // GET /api/orders/:orderNumber
    if (method === 'GET' && path.startsWith('orders/')) {
      const orderNumber = path.split('/')[1]
      const order = await db.collection('orders').findOne({ orderNumber }, { projection: { _id: 0 } })
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      return NextResponse.json({ order })
    }

    // =========== ADMIN ROUTES ===========
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN_SECRET || 'jigyasa_admin_secret_2025'
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
    const isAuthed = () => request.headers.get('x-admin-token') === ADMIN_TOKEN

    // POST /api/admin/login  { password }
    if (method === 'POST' && path === 'admin/login') {
      const { password } = await request.json()
      if (password !== ADMIN_PASSWORD) {
        return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 })
      }
      return NextResponse.json({ ok: true, token: ADMIN_TOKEN })
    }

    // Guard all admin routes below
    if (path.startsWith('admin/') && path !== 'admin/login') {
      if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // GET /api/admin/stats
    if (method === 'GET' && path === 'admin/stats') {
      const [productCount, orderCount, orders] = await Promise.all([
        db.collection('products').countDocuments(),
        db.collection('orders').countDocuments(),
        db.collection('orders').find({}, { projection: { total: 1, status: 1, createdAt: 1, _id: 0 } }).toArray(),
      ])
      const revenue = orders.reduce((s, o) => s + (o.total || 0), 0)
      const pendingOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length
      const lowStock = await db.collection('products').countDocuments({ stock: { $lt: 20 } })
      return NextResponse.json({ productCount, orderCount, revenue, pendingOrders, lowStock })
    }

    // GET /api/admin/products
    if (method === 'GET' && path === 'admin/products') {
      const products = await db.collection('products').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray()
      return NextResponse.json({ products })
    }

    // POST /api/admin/products  (create)
    if (method === 'POST' && path === 'admin/products') {
      const body = await request.json()
      const doc = {
        id: uuidv4(),
        name: body.name,
        category: body.category || 'Cotton Fabric',
        fabric: body.fabric || 'Cotton',
        unit: body.unit || 'meter',
        price: Number(body.price) || 0,
        mrp: Number(body.mrp) || 0,
        image: body.image || '',
        gsm: Number(body.gsm) || 0,
        weave: body.weave || '',
        stock: Number(body.stock) || 0,
        rating: Number(body.rating) || 4.0,
        ratingCount: Number(body.ratingCount) || 0,
        colors: body.colors ? (Array.isArray(body.colors) ? body.colors : String(body.colors).split(',').map(c => c.trim())) : [],
        description: body.description || '',
        bestSeller: !!body.bestSeller,
        createdAt: new Date(),
      }
      await db.collection('products').insertOne(doc)
      const { _id, ...clean } = doc
      return NextResponse.json({ ok: true, product: clean })
    }

    // PUT /api/admin/products/:id  (update)
    if (method === 'PUT' && path.startsWith('admin/products/')) {
      const id = path.split('/')[2]
      const body = await request.json()
      const update = { ...body }
      delete update._id; delete update.id; delete update.createdAt
      if (update.price !== undefined) update.price = Number(update.price)
      if (update.mrp !== undefined) update.mrp = Number(update.mrp)
      if (update.stock !== undefined) update.stock = Number(update.stock)
      if (update.gsm !== undefined) update.gsm = Number(update.gsm)
      if (update.colors && typeof update.colors === 'string') update.colors = update.colors.split(',').map(c => c.trim())
      const r = await db.collection('products').findOneAndUpdate(
        { id }, { $set: update }, { returnDocument: 'after', projection: { _id: 0 } }
      )
      const updated = r?.value || r
      if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ ok: true, product: updated })
    }

    // DELETE /api/admin/products/:id
    if (method === 'DELETE' && path.startsWith('admin/products/')) {
      const id = path.split('/')[2]
      await db.collection('products').deleteOne({ id })
      return NextResponse.json({ ok: true })
    }

    // GET /api/admin/orders
    if (method === 'GET' && path === 'admin/orders') {
      const orders = await db.collection('orders').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(200).toArray()
      return NextResponse.json({ orders })
    }

    // PUT /api/admin/orders/:orderNumber  { status }
    if (method === 'PUT' && path.startsWith('admin/orders/')) {
      const orderNumber = path.split('/')[2]
      const body = await request.json()
      const update = {}
      if (body.status) update.status = body.status
      if (body.awb) update.awb = body.awb
      const r = await db.collection('orders').findOneAndUpdate(
        { orderNumber }, { $set: update }, { returnDocument: 'after', projection: { _id: 0 } }
      )
      const updated = r?.value || r
      if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ ok: true, order: updated })
    }

    // Health
    if (method === 'GET' && (path === '' || path === 'health')) {
      return NextResponse.json({ ok: true, service: 'jigyasa-fabrics', ts: Date.now() })
    }

    return NextResponse.json({ error: 'Route not found', path, method }, { status: 404 })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler
