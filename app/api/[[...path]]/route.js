import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'

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
    const db = await getDb()
    await ensureSeed(db)

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
