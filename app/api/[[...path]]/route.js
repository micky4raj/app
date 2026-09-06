import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import Razorpay from 'razorpay'
import crypto from 'node:crypto'

const uri = process.env.MONGODB_URI || process.env.MONGO_URL
const dbName = process.env.DB_NAME || 'jigyasa_fabrics'

let cachedClient = null
async function getDb() {
  if (!uri) {
    throw new Error(
      'Missing MongoDB connection string. Set MONGODB_URI (provided by the MongoDB Atlas integration).'
    )
  }
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

// ---------- SEED DATA (v2 - Sanganer & Bagru block prints only) ----------
const SEED_VERSION = 2
const SEED_PRODUCTS = [
  // ============ SANGANER (fine floral, cream base) ============
  {
    name: 'Sanganer Floral Print Cotton Saree',
    category: 'Sanganer',
    productType: 'Saree',
    fabric: 'Pure Cotton',
    unit: 'piece',
    price: 1899,
    mrp: 3599,
    image: 'https://images.unsplash.com/photo-1717585679395-bbe39b5fb6bc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHwzfHxzYXJlZSUyMGZhYnJpY3xlbnwwfHx8fDE3ODg1OTU2Mzd8MA&ixlib=rb-4.1.0&q=85',
    gsm: 110,
    weave: 'Hand Block Print',
    stock: 24,
    rating: 4.7,
    ratingCount: 486,
    colors: ['Cream', 'Rose', 'Green'],
    description: 'Authentic Sanganer hand block-printed cotton saree with fine floral butis. Natural vegetable dyes. Includes running blouse piece. Traditionally crafted in Sanganer, Rajasthan.',
    bestSeller: true,
  },
  {
    name: 'Sanganer Pastel Cotton Suit Set (3-piece)',
    category: 'Sanganer',
    productType: 'Suit Set',
    fabric: 'Pure Cotton',
    unit: 'set',
    price: 1499,
    mrp: 2999,
    image: 'https://images.unsplash.com/photo-1783763625188-a27fa4323868?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHw0fHxibG9jayUyMHByaW50JTIwZmFicmljfGVufDB8fHx8MTc4ODU5NTYyNnww&ixlib=rb-4.1.0&q=85',
    gsm: 120,
    weave: 'Hand Block Print',
    stock: 45,
    rating: 4.6,
    ratingCount: 823,
    colors: ['Ivory', 'Mint', 'Peach'],
    description: 'Delicate Sanganer print unstitched suit set — 2.5m top + 2.5m bottom + 2.25m dupatta. Fine floral motifs on pastel cotton, hand-printed with wooden blocks.',
    bestSeller: true,
  },
  {
    name: 'Sanganer Buti Print Cotton (per meter)',
    category: 'Sanganer',
    productType: 'Fabric',
    fabric: 'Pure Cotton',
    unit: 'meter',
    price: 299,
    mrp: 499,
    image: 'https://images.unsplash.com/photo-1612863233759-9e788611b406?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHw0fHxjb3R0b24lMjBwcmludHxlbnwwfHx8fDE3ODg1OTU2Mzd8MA&ixlib=rb-4.1.0&q=85',
    gsm: 100,
    weave: 'Hand Block Print',
    stock: 320,
    rating: 4.5,
    ratingCount: 1547,
    colors: ['White', 'Rose Pink'],
    description: 'Classic Sanganer buti (small floral motif) hand-block printed pure cotton, sold per meter. Perfect for kurtas, dresses & home décor.',
    bestSeller: true,
  },
  {
    name: 'Sanganer Rose Print Cotton Dupatta',
    category: 'Sanganer',
    productType: 'Dupatta',
    fabric: 'Mulmul Cotton',
    unit: 'piece',
    price: 649,
    mrp: 1299,
    image: 'https://images.unsplash.com/photo-1783764245498-31991c8a6cae?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwyfHxibG9jayUyMHByaW50JTIwZmFicmljfGVufDB8fHx8MTc4ODU5NTYyNnww&ixlib=rb-4.1.0&q=85',
    gsm: 80,
    weave: 'Hand Block Print',
    stock: 60,
    rating: 4.4,
    ratingCount: 312,
    colors: ['Cream', 'Rose'],
    description: 'Soft mulmul cotton dupatta with Sanganer rose print. Lightweight & breathable. 2.5m x 0.9m.',
  },
  {
    name: 'Sanganer Fine Floral Cotton Kurta Fabric',
    category: 'Sanganer',
    productType: 'Fabric',
    fabric: 'Pure Cotton',
    unit: 'meter',
    price: 259,
    mrp: 449,
    image: 'https://images.unsplash.com/photo-1783763624907-b9974ce1dbe3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwzfHxibG9jayUyMHByaW50JTIwZmFicmljfGVufDB8fHx8MTc4ODU5NTYyNnww&ixlib=rb-4.1.0&q=85',
    gsm: 105,
    weave: 'Hand Block Print',
    stock: 220,
    rating: 4.3,
    ratingCount: 674,
    colors: ['White', 'Indigo Print'],
    description: 'Fine Sanganer floral hand block print on breathable cotton. Ideal for kurtas & summer wear. Sold per meter.',
  },

  // ============ BAGRU (bold geometric, indigo/red/black on beige) ============
  {
    name: 'Indigo Bagru Dabu Print Cotton Saree',
    category: 'Bagru',
    productType: 'Saree',
    fabric: 'Pure Cotton',
    unit: 'piece',
    price: 2299,
    mrp: 4299,
    image: 'https://images.unsplash.com/photo-1710440189404-e95fabead2a3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHwyfHxzYXJlZSUyMGZhYnJpY3xlbnwwfHx8fDE3ODg1OTU2Mzd8MA&ixlib=rb-4.1.0&q=85',
    gsm: 120,
    weave: 'Dabu Mud-Resist Print',
    stock: 18,
    rating: 4.8,
    ratingCount: 291,
    colors: ['Indigo', 'Beige'],
    description: 'Traditional Bagru dabu (mud-resist) hand block-printed indigo cotton saree from Bagru village. Deep natural indigo dye with geometric motifs.',
    bestSeller: true,
  },
  {
    name: 'Bagru Dabu Print Cotton Suit Set',
    category: 'Bagru',
    productType: 'Suit Set',
    fabric: 'Pure Cotton',
    unit: 'set',
    price: 1699,
    mrp: 3399,
    image: 'https://images.unsplash.com/photo-1773846012458-e6a66c26e49f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwxfHxibG9jayUyMHByaW50JTIwZmFicmljfGVufDB8fHx8MTc4ODU5NTYyNnww&ixlib=rb-4.1.0&q=85',
    gsm: 130,
    weave: 'Dabu Mud-Resist Print',
    stock: 32,
    rating: 4.7,
    ratingCount: 512,
    colors: ['Indigo', 'Black', 'Beige'],
    description: 'Authentic Bagru dabu print unstitched suit set — 2.5m top + 2.5m bottom + 2.25m dupatta. Bold geometric motifs from Bagru artisans.',
    bestSeller: true,
  },
  {
    name: 'Bagru Geometric Print Cotton (per meter)',
    category: 'Bagru',
    productType: 'Fabric',
    fabric: 'Pure Cotton',
    unit: 'meter',
    price: 279,
    mrp: 499,
    image: 'https://images.unsplash.com/photo-1669556273167-8d4679c4f082?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwzfHxJbmRpYW4lMjB0ZXh0aWxlfGVufDB8fHx8MTc4ODU5NTYzMXww&ixlib=rb-4.1.0&q=85',
    gsm: 115,
    weave: 'Hand Block Print',
    stock: 380,
    rating: 4.4,
    ratingCount: 1123,
    colors: ['Rust', 'Black', 'Beige'],
    description: 'Bagru hand block-printed cotton with bold traditional motifs. Sold per meter. Perfect for kurtas, jackets & home furnishings.',
  },
  {
    name: 'Bagru Traditional Print Cotton Dupatta',
    category: 'Bagru',
    productType: 'Dupatta',
    fabric: 'Pure Cotton',
    unit: 'piece',
    price: 749,
    mrp: 1499,
    image: 'https://images.unsplash.com/photo-1762764214015-d5c22646465b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwyfHxJbmRpYW4lMjB0ZXh0aWxlfGVufDB8fHx8MTc4ODU5NTYzMXww&ixlib=rb-4.1.0&q=85',
    gsm: 90,
    weave: 'Hand Block Print',
    stock: 48,
    rating: 4.5,
    ratingCount: 267,
    colors: ['Indigo', 'Red', 'Beige'],
    description: 'Handcrafted Bagru cotton dupatta with traditional Rajasthani block motifs. 2.5m x 0.9m. Naturally dyed.',
  },
  {
    name: 'Bagru Red-Black Print Kurta Fabric',
    category: 'Bagru',
    productType: 'Fabric',
    fabric: 'Pure Cotton',
    unit: 'meter',
    price: 249,
    mrp: 429,
    image: 'https://images.pexels.com/photos/10317127/pexels-photo-10317127.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    gsm: 110,
    weave: 'Hand Block Print',
    stock: 260,
    rating: 4.3,
    ratingCount: 542,
    colors: ['Red', 'Black', 'Cream'],
    description: 'Classic Bagru print in traditional red & black on cream cotton. Naturally dyed, sold per meter. Great for kurtas.',
  },
]

async function ensureSeed(db) {
  // Atomic guard: only ONE concurrent request can pass this check
  const claim = await db.collection('_meta').findOneAndUpdate(
    { key: 'seed', version: { $lt: SEED_VERSION } },
    { $set: { key: 'seed', version: SEED_VERSION, seedingAt: new Date() } },
    { upsert: true, returnDocument: 'before' }
  )
  // If the "before" doc already has version >= SEED_VERSION, another request already seeded
  const prev = claim?.value || claim
  if (prev && prev.version >= SEED_VERSION) return
  try {
    await db.collection('products').deleteMany({})
    const docs = SEED_PRODUCTS.map(p => ({
      id: uuidv4(),
      ...p,
      createdAt: new Date(),
    }))
    await db.collection('products').insertMany(docs)
  } catch (e) {
    // On failure, roll back so a retry can attempt again
    await db.collection('_meta').updateOne({ key: 'seed' }, { $set: { version: 0 } })
    throw e
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

    // =========== CHIPA AI CHATBOT ===========
    // POST /api/chipa  { messages: [{role, content}], sessionId? }
    if (method === 'POST' && path === 'chipa') {
      const body = await request.json()
      const { messages = [], sessionId } = body
      if (!Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({ error: 'messages required' }, { status: 400 })
      }
      // Cap history to last 20 to control tokens
      const trimmed = messages.slice(-20).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 4000),
      }))

      // Load top products for context (short)
      const products = await db.collection('products')
        .find({}, { projection: { _id: 0, name: 1, category: 1, productType: 1, price: 1, unit: 1, fabric: 1, stock: 1 } })
        .limit(20).toArray()
      const catalogSummary = products.map(p =>
        `- ${p.name} (${p.category} • ${p.productType || 'Fabric'}) · ₹${p.price} per ${p.unit} · ${p.stock} in stock`
      ).join('\n')

      const systemPrompt = `You are Chipa, the friendly customer-facing assistant for Label Jigyasa — a boutique e-commerce store specializing in authentic Rajasthani hand block prints (Sanganer and Bagru).

TONE: Warm, culturally respectful, concise. Use light Hindi phrases sparingly (namaste, dhanyavaad). Never overly formal.

WHAT YOU KNOW:
- Sanganer print: Fine, delicate floral motifs (butis) hand-block printed on cream/white cotton. Naturally dyed with vegetable colors. From Sanganer village, Rajasthan.
- Bagru print: Bold geometric motifs using DABU (mud-resist) technique. Traditional indigo, rust, red, black on beige. From Bagru village, Rajasthan.
- All products are 100% pure cotton, naturally dyed, handcrafted by master artisans.
- Free shipping on orders above rupees 999. GST 5%. Easy 7-day returns. Pan-India delivery + international.
- Payments: UPI, Cards, NetBanking, COD (via Razorpay).
- Care: Hand wash cold water, dry in shade to preserve natural dyes.

CURRENT CATALOG (live stock):
${catalogSummary}

BEHAVIOR RULES:
- Never invent prices, stock, or delivery dates outside the catalog above.
- Recommend 2-3 products max per query with product name + price.
- For fabric-per-meter items, remind that 2.5m top + 2.5m bottom + 2.25m dupatta is roughly 7m total for a full suit.
- For care questions, recommend hand wash separately in cold water.
- If asked about something unrelated (weather, general chat), gently redirect to fabric queries.
- Keep answers under 120 words unless the user asks for detailed care/technique info.`

      try {
        const llmRes = await fetch(`${process.env.EMERGENT_LLM_BASE_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EMERGENT_LLM_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.CHIPA_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }, ...trimmed],
            temperature: 0.5,
            max_tokens: 400,
          }),
        })
        if (!llmRes.ok) {
          const errText = await llmRes.text()
          console.error('LLM error:', errText)
          return NextResponse.json({ error: 'Chipa is having a moment. Please try again.' }, { status: 502 })
        }
        const data = await llmRes.json()
        const answer = data.choices?.[0]?.message?.content?.trim() || ''
        if (!answer) return NextResponse.json({ error: 'Empty response' }, { status: 502 })

        // Persist chat log
        const convId = sessionId || uuidv4()
        await db.collection('chats').insertOne({
          sessionId: convId,
          userMessage: trimmed[trimmed.length - 1]?.content || '',
          answer,
          model: data.model,
          createdAt: new Date(),
        })
        return NextResponse.json({ answer, sessionId: convId, model: data.model })
      } catch (e) {
        console.error('Chipa error:', e)
        return NextResponse.json({ error: 'Network error reaching Chipa' }, { status: 500 })
      }
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
