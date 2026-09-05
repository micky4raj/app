'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ShoppingBag, Star, Heart, Plus, Minus, X, MapPin, Truck, ShieldCheck,
  ChevronRight, Package, Sparkles, IndianRupee, CheckCircle2, Filter, Copy, PhoneCall,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

const CATEGORIES = ['All', 'Saree', 'Suit Set', 'Cotton Fabric', 'Silk Fabric']
const BRAND = {
  name: 'Jigyasa Fabrics',
  tag: 'Woven with tradition. Delivered pan-India.',
}

const rupee = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('popular')
  const [priceRange, setPriceRange] = useState([0, 15000])
  const [showFilters, setShowFilters] = useState(false)

  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [wishlist, setWishlist] = useState([])

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [orderResult, setOrderResult] = useState(null)

  // ---- load cart from localStorage
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem('jf_cart') || '[]')
      const w = JSON.parse(localStorage.getItem('jf_wish') || '[]')
      setCart(c); setWishlist(w)
    } catch {}
  }, [])
  useEffect(() => { localStorage.setItem('jf_cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('jf_wish', JSON.stringify(wishlist)) }, [wishlist])

  // ---- fetch products
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      category, search, sort,
      minPrice: String(priceRange[0]), maxPrice: String(priceRange[1]),
    })
    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(d => { setProducts(d.products || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [category, search, sort, priceRange])

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart])
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart])

  const addToCart = (p, qty = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(x => x.id === p.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + qty }
        return next
      }
      return [...prev, { id: p.id, name: p.name, price: p.price, mrp: p.mrp, image: p.image, unit: p.unit, qty }]
    })
    toast.success('Added to cart', { description: p.name })
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
  }
  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id))

  const toggleWish = (id) => setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div className="min-h-screen">
      <Header cartCount={cartCount} onCartClick={() => setCartOpen(true)} search={search} setSearch={setSearch} />

      <Hero />

      <CategoryStrip category={category} setCategory={setCategory} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
              {category === 'All' ? 'Featured Fabrics' : category}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">{products.length} products</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowFilters(true)}>
              <Filter className="h-4 w-4 mr-2" /> Filters
            </Button>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[180px] bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Popularity</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Customer Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
          {/* Sidebar filters (desktop) */}
          <aside className="hidden md:block bg-white rounded-lg border border-neutral-200 p-5 h-fit sticky top-24">
            <FiltersPanel priceRange={priceRange} setPriceRange={setPriceRange} category={category} setCategory={setCategory} />
          </aside>

          {/* Product grid */}
          <section>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-72 bg-white rounded-lg border animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <Package className="h-12 w-12 mx-auto text-neutral-300" />
                <p className="mt-4 text-neutral-500">No products match your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    p={p}
                    delay={i * 0.03}
                    onOpen={() => setSelected(p)}
                    onAdd={() => addToCart(p)}
                    wished={wishlist.includes(p.id)}
                    onWish={() => toggleWish(p.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <TrustStrip />
      </main>

      <Footer />

      {/* Product Detail Dialog */}
      <ProductDialog
        open={!!selected}
        product={selected}
        onClose={() => setSelected(null)}
        onAdd={(qty) => { addToCart(selected, qty); setSelected(null) }}
        wished={selected ? wishlist.includes(selected.id) : false}
        onWish={() => selected && toggleWish(selected.id)}
      />

      {/* Cart Sheet */}
      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cart}
        updateQty={updateQty}
        removeItem={removeItem}
        total={cartTotal}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true) }}
      />

      {/* Mobile filters sheet */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent side="left" className="w-[85vw] sm:w-96">
          <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
          <div className="mt-4">
            <FiltersPanel priceRange={priceRange} setPriceRange={setPriceRange} category={category} setCategory={setCategory} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        cart={cart}
        subtotal={cartTotal}
        onSuccess={(order) => {
          setCart([])
          setCheckoutOpen(false)
          setOrderResult(order)
        }}
      />

      {/* Order Success */}
      <OrderSuccessDialog
        order={orderResult}
        onClose={() => setOrderResult(null)}
      />
    </div>
  )
}

// ---------- HEADER ----------
function Header({ cartCount, onCartClick, search, setSearch }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-200">
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center gap-3 md:gap-6">
        <a href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-[#8b1e3f] to-[#c14b6c] flex items-center justify-center text-white font-bold shadow-md">
            J
          </div>
          <div className="hidden sm:block">
            <div className="font-bold text-[15px] md:text-base leading-tight text-[#8b1e3f]">Jigyasa Fabrics</div>
            <div className="text-[10px] md:text-[11px] text-neutral-500 -mt-0.5 italic">Explore Plus <span className="text-yellow-500">★</span></div>
          </div>
        </a>

        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search sarees, cotton, silk, suit sets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-neutral-50 border-neutral-200 focus-visible:ring-[#8b1e3f]"
            />
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={onCartClick} className="relative">
          <ShoppingBag className="h-5 w-5" />
          <span className="hidden md:inline ml-2">Cart</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#8b1e3f] text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-semibold">
              {cartCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  )
}

// ---------- HERO ----------
function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#fff2e8] via-[#ffe8ec] to-[#fdd7c5]">
      <div className="container mx-auto px-4 py-10 md:py-16 grid md:grid-cols-2 items-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="bg-[#8b1e3f] hover:bg-[#8b1e3f] text-white mb-4">
            <Sparkles className="h-3 w-3 mr-1" /> Summer Collection 2025 — Up to 60% OFF
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 leading-tight">
            Premium Indian Fabrics.
            <br />
            <span className="text-[#8b1e3f]">Woven with love.</span>
          </h1>
          <p className="mt-4 text-neutral-600 max-w-lg">
            Handpicked sarees, unstitched suit sets and pure fabrics from India's finest looms — sold per meter, per piece, or as suit-set bundles. Free shipping on orders above ₹999.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" className="bg-[#8b1e3f] hover:bg-[#701731] text-white" onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}>
              Shop Now <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button size="lg" variant="outline" className="border-[#8b1e3f] text-[#8b1e3f] hover:bg-[#8b1e3f] hover:text-white">
              Track Order
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-neutral-600">
            <span className="flex items-center gap-1"><Truck className="h-4 w-4 text-[#8b1e3f]" /> Pan-India Delivery</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-[#8b1e3f]" /> 100% Authentic</span>
            <span className="flex items-center gap-1"><Package className="h-4 w-4 text-[#8b1e3f]" /> Easy Returns</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative"
        >
          <div className="grid grid-cols-2 gap-3">
            <img src="https://images.unsplash.com/photo-1618901185975-d59f7091bcfe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHxzYXJlZXxlbnwwfHx8fDE3ODg1ODE0OTl8MA&ixlib=rb-4.1.0&q=85" className="rounded-xl aspect-[3/4] object-cover shadow-lg" alt="Bridal saree" />
            <div className="grid grid-rows-2 gap-3">
              <img src="https://images.unsplash.com/photo-1624516268152-1e48624026ed?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwyfHx0ZXh0aWxlJTIwY29sb3JmdWx8ZW58MHx8fHwxNzg4NTgxNTA0fDA&ixlib=rb-4.1.0&q=85" className="rounded-xl aspect-square object-cover shadow-lg" alt="Colorful fabrics" />
              <img src="https://images.unsplash.com/photo-1669556289350-0e2480fe190e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHw0fHxpbmRpYW4lMjBmYWJyaWN8ZW58MHx8fHwxNzg4NTgxNDk5fDA&ixlib=rb-4.1.0&q=85" className="rounded-xl aspect-square object-cover shadow-lg" alt="Print cotton" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ---------- CATEGORY STRIP ----------
function CategoryStrip({ category, setCategory }) {
  return (
    <div id="catalog" className="bg-white border-b border-neutral-200 sticky top-16 md:top-20 z-30">
      <div className="container mx-auto px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              category === c
                ? 'bg-[#8b1e3f] text-white shadow'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------- FILTERS ----------
function FiltersPanel({ priceRange, setPriceRange, category, setCategory }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm mb-3">Category</h3>
        <div className="space-y-2">
          {CATEGORIES.map(c => (
            <label key={c} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="cat"
                checked={category === c}
                onChange={() => setCategory(c)}
                className="accent-[#8b1e3f]"
              />
              {c}
            </label>
          ))}
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="font-semibold text-sm mb-3">Price Range</h3>
        <Slider
          min={0} max={15000} step={100}
          value={priceRange}
          onValueChange={setPriceRange}
          className="[&_[role=slider]]:bg-[#8b1e3f]"
        />
        <div className="flex justify-between text-xs text-neutral-600 mt-2">
          <span>{rupee(priceRange[0])}</span>
          <span>{rupee(priceRange[1])}</span>
        </div>
      </div>
    </div>
  )
}

// ---------- PRODUCT CARD ----------
function ProductCard({ p, onOpen, onAdd, wished, onWish, delay = 0 }) {
  const discount = Math.round(((p.mrp - p.price) / p.mrp) * 100)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-lg border border-neutral-200 hover:border-[#8b1e3f]/40 hover:shadow-lg transition overflow-hidden group cursor-pointer"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50" onClick={onOpen}>
        <img
          src={p.image}
          alt={p.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          loading="lazy"
        />
        {p.bestSeller && (
          <Badge className="absolute top-2 left-2 bg-amber-500 hover:bg-amber-500 text-white text-[10px]">Bestseller</Badge>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onWish() }}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow hover:bg-white"
        >
          <Heart className={`h-4 w-4 ${wished ? 'fill-[#8b1e3f] text-[#8b1e3f]' : 'text-neutral-600'}`} />
        </button>
      </div>
      <div className="p-3" onClick={onOpen}>
        <h3 className="text-sm font-medium line-clamp-2 text-neutral-800 min-h-[2.5rem]">{p.name}</h3>
        <div className="flex items-center gap-1 mt-1">
          <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
            {p.rating} <Star className="h-2.5 w-2.5 fill-white" />
          </span>
          <span className="text-xs text-neutral-500">({p.ratingCount?.toLocaleString('en-IN')})</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-lg font-bold text-neutral-900">{rupee(p.price)}</span>
          <span className="text-xs text-neutral-400 line-through">{rupee(p.mrp)}</span>
          <span className="text-xs font-semibold text-green-700">{discount}% off</span>
        </div>
        <div className="text-[10px] text-neutral-500 mt-1">per {p.unit} • {p.fabric}</div>
      </div>
      <div className="px-3 pb-3">
        <Button size="sm" onClick={(e) => { e.stopPropagation(); onAdd() }} className="w-full bg-[#8b1e3f] hover:bg-[#701731]">
          <ShoppingBag className="h-3.5 w-3.5 mr-1.5" /> Add to Cart
        </Button>
      </div>
    </motion.div>
  )
}

// ---------- PRODUCT DIALOG ----------
function ProductDialog({ open, product, onClose, onAdd, wished, onWish }) {
  const [qty, setQty] = useState(1)
  const [pin, setPin] = useState('')
  const [pinResult, setPinResult] = useState(null)
  const [checkingPin, setCheckingPin] = useState(false)

  useEffect(() => { setQty(1); setPin(''); setPinResult(null) }, [product])

  if (!product) return null
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100)

  const checkPin = async () => {
    setCheckingPin(true)
    try {
      const r = await fetch('/api/pincode-check', { method: 'POST', body: JSON.stringify({ pincode: pin }) })
      const d = await r.json()
      setPinResult(d)
    } catch { setPinResult({ ok: false, message: 'Try again' }) }
    setCheckingPin(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0">
        <div className="grid md:grid-cols-2">
          <div className="bg-neutral-50 relative">
            <img src={product.image} alt={product.name} className="w-full h-full max-h-[500px] object-cover" />
            <button onClick={onWish} className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white shadow flex items-center justify-center">
              <Heart className={`h-4 w-4 ${wished ? 'fill-[#8b1e3f] text-[#8b1e3f]' : 'text-neutral-600'}`} />
            </button>
          </div>
          <div className="p-6 flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl leading-tight">{product.name}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
                {product.rating} <Star className="h-3 w-3 fill-white" />
              </span>
              <span className="text-xs text-neutral-500">{product.ratingCount?.toLocaleString('en-IN')} ratings</span>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold">{rupee(product.price)}</span>
              <span className="text-neutral-400 line-through">{rupee(product.mrp)}</span>
              <span className="text-green-700 font-semibold text-sm">{discount}% off</span>
            </div>
            <div className="text-xs text-neutral-500 mt-1">Inclusive of all taxes • Sold per {product.unit}</div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="bg-neutral-50 p-2 rounded"><span className="text-neutral-500">Fabric:</span> <b>{product.fabric}</b></div>
              <div className="bg-neutral-50 p-2 rounded"><span className="text-neutral-500">GSM:</span> <b>{product.gsm}</b></div>
              <div className="bg-neutral-50 p-2 rounded"><span className="text-neutral-500">Weave:</span> <b>{product.weave}</b></div>
              <div className="bg-neutral-50 p-2 rounded"><span className="text-neutral-500">In Stock:</span> <b>{product.stock}</b></div>
            </div>

            <p className="text-sm text-neutral-600 mt-4">{product.description}</p>

            {/* Quantity */}
            <div className="mt-5 flex items-center gap-3">
              <Label className="text-sm">Quantity ({product.unit})</Label>
              <div className="flex items-center border rounded-md">
                <Button variant="ghost" size="sm" onClick={() => setQty(q => Math.max(1, q - 1))}><Minus className="h-3 w-3" /></Button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <Button variant="ghost" size="sm" onClick={() => setQty(q => q + 1)}><Plus className="h-3 w-3" /></Button>
              </div>
            </div>

            {/* Pincode checker */}
            <div className="mt-4 border rounded-lg p-3 bg-neutral-50">
              <Label className="text-xs flex items-center gap-1 text-neutral-700"><MapPin className="h-3.5 w-3.5" /> Check Delivery</Label>
              <div className="mt-2 flex gap-2">
                <Input placeholder="Enter 6-digit pincode" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} className="bg-white" />
                <Button size="sm" variant="outline" disabled={pin.length !== 6 || checkingPin} onClick={checkPin}>
                  {checkingPin ? 'Checking...' : 'Check'}
                </Button>
              </div>
              {pinResult && (
                <div className={`mt-2 text-xs ${pinResult.ok ? 'text-green-700' : 'text-red-600'} flex items-center gap-1`}>
                  {pinResult.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  {pinResult.message}
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 flex gap-2">
              <Button className="flex-1 bg-[#8b1e3f] hover:bg-[#701731] h-12" onClick={() => onAdd(qty)}>
                <ShoppingBag className="h-4 w-4 mr-2" /> Add to Cart
              </Button>
              <Button variant="outline" className="flex-1 border-[#8b1e3f] text-[#8b1e3f] hover:bg-[#8b1e3f] hover:text-white h-12" onClick={() => onAdd(qty)}>
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------- CART ----------
function CartSheet({ open, onOpenChange, cart, updateQty, removeItem, total, onCheckout }) {
  const shipping = total > 999 || total === 0 ? 0 : 79
  const tax = Math.round(total * 0.05)
  const grandTotal = total + shipping + tax

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#8b1e3f]" /> Your Cart ({cart.length})
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
            <ShoppingBag className="h-14 w-14 text-neutral-300" />
            <p className="mt-4 text-neutral-500">Your cart is empty</p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>Continue Shopping</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              <AnimatePresence>
                {cart.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-3 border rounded-lg p-3 bg-white"
                  >
                    <img src={item.image} alt={item.name} className="h-20 w-20 object-cover rounded-md bg-neutral-50" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm line-clamp-2">{item.name}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">per {item.unit}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border rounded">
                          <button onClick={() => updateQty(item.id, -1)} className="px-2 py-0.5 hover:bg-neutral-100"><Minus className="h-3 w-3" /></button>
                          <span className="px-2 text-sm font-semibold">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="px-2 py-0.5 hover:bg-neutral-100"><Plus className="h-3 w-3" /></button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-xs text-red-600 hover:underline ml-auto">Remove</button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{rupee(item.price * item.qty)}</div>
                      <div className="text-[10px] text-neutral-400 line-through">{rupee(item.mrp * item.qty)}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="border-t pt-4 space-y-2">
              <Row label="Subtotal" value={rupee(total)} />
              <Row label="Shipping" value={shipping === 0 ? <span className="text-green-600">FREE</span> : rupee(shipping)} />
              <Row label="GST (5%)" value={rupee(tax)} />
              <Separator />
              <Row label={<b>Total</b>} value={<b className="text-lg">{rupee(grandTotal)}</b>} />
              <Button size="lg" onClick={onCheckout} className="w-full bg-[#8b1e3f] hover:bg-[#701731] mt-2">
                Proceed to Checkout <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Row({ label, value }) {
  return <div className="flex justify-between text-sm"><span className="text-neutral-600">{label}</span><span>{value}</span></div>
}

// ---------- CHECKOUT ----------
function CheckoutDialog({ open, onOpenChange, cart, subtotal, onSuccess }) {
  const [step, setStep] = useState(1) // 1=address, 2=payment
  const [placing, setPlacing] = useState(false)
  const [address, setAddress] = useState({
    name: '', phone: '', email: '', pincode: '', line1: '', city: '', state: '', gstin: '',
  })
  const [payment, setPayment] = useState('UPI')

  useEffect(() => { if (open) setStep(1) }, [open])

  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 79
  const tax = Math.round(subtotal * 0.05)
  const total = subtotal + shipping + tax

  const addressValid = address.name && address.phone.length === 10 && /^[1-9][0-9]{5}$/.test(address.pincode) && address.line1 && address.city && address.state

  const placeOrder = async () => {
    setPlacing(true)
    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart, address, payment: { method: payment },
          subtotal, shipping, tax, total,
        }),
      })
      const d = await r.json()
      if (d.ok) {
        toast.success('Order placed successfully! 🎉')
        onSuccess(d.order)
      } else {
        toast.error(d.error || 'Failed to place order')
      }
    } catch (e) {
      toast.error('Network error')
    } finally { setPlacing(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Checkout
            <div className="flex items-center gap-1 text-xs font-normal">
              <span className={step >= 1 ? 'text-[#8b1e3f] font-semibold' : 'text-neutral-400'}>1. Address</span>
              <ChevronRight className="h-3 w-3" />
              <span className={step >= 2 ? 'text-[#8b1e3f] font-semibold' : 'text-neutral-400'}>2. Payment</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          <div>
            {step === 1 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Delivery Address</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Full Name *</Label><Input value={address.name} onChange={e => setAddress(a => ({ ...a, name: e.target.value }))} /></div>
                  <div><Label className="text-xs">Phone *</Label><Input value={address.phone} maxLength={10} onChange={e => setAddress(a => ({ ...a, phone: e.target.value.replace(/\D/g, '') }))} /></div>
                  <div className="col-span-2"><Label className="text-xs">Email</Label><Input value={address.email} onChange={e => setAddress(a => ({ ...a, email: e.target.value }))} /></div>
                  <div className="col-span-2"><Label className="text-xs">Address Line *</Label><Input value={address.line1} onChange={e => setAddress(a => ({ ...a, line1: e.target.value }))} placeholder="House no, street, area" /></div>
                  <div><Label className="text-xs">Pincode *</Label><Input maxLength={6} value={address.pincode} onChange={e => setAddress(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '') }))} /></div>
                  <div><Label className="text-xs">City *</Label><Input value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} /></div>
                  <div><Label className="text-xs">State *</Label><Input value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} /></div>
                  <div><Label className="text-xs">GSTIN (optional)</Label><Input value={address.gstin} onChange={e => setAddress(a => ({ ...a, gstin: e.target.value }))} /></div>
                </div>
                <Button disabled={!addressValid} onClick={() => setStep(2)} className="w-full bg-[#8b1e3f] hover:bg-[#701731] mt-3">
                  Continue to Payment <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Choose Payment Method</h3>
                <RadioGroup value={payment} onValueChange={setPayment} className="space-y-2">
                  {[
                    { v: 'UPI', label: 'UPI (Razorpay)', desc: 'GPay, PhonePe, Paytm — instant' },
                    { v: 'CARD', label: 'Credit / Debit Card', desc: 'Visa, MasterCard, RuPay' },
                    { v: 'NETBANKING', label: 'Net Banking', desc: 'All major banks' },
                    { v: 'COD', label: 'Cash on Delivery', desc: '+ ₹49 handling fee' },
                  ].map(opt => (
                    <label key={opt.v} className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:border-[#8b1e3f] ${payment === opt.v ? 'border-[#8b1e3f] bg-rose-50/40' : ''}`}>
                      <RadioGroupItem value={opt.v} />
                      <div>
                        <div className="font-medium text-sm">{opt.label}</div>
                        <div className="text-xs text-neutral-500">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button disabled={placing} onClick={placeOrder} className="flex-1 bg-[#8b1e3f] hover:bg-[#701731]">
                    {placing ? 'Placing order...' : `Place Order • ${rupee(total)}`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-neutral-50 rounded-lg p-4 h-fit">
            <h4 className="font-semibold text-sm mb-3">Order Summary</h4>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {cart.map(i => (
                <div key={i.id} className="flex gap-2 text-xs">
                  <img src={i.image} className="h-10 w-10 rounded object-cover" alt="" />
                  <div className="flex-1"><div className="line-clamp-1">{i.name}</div><div className="text-neutral-500">Qty: {i.qty}</div></div>
                  <div className="font-semibold">{rupee(i.price * i.qty)}</div>
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <Row label="Subtotal" value={rupee(subtotal)} />
            <Row label="Shipping" value={shipping === 0 ? <span className="text-green-600">FREE</span> : rupee(shipping)} />
            <Row label="GST (5%)" value={rupee(tax)} />
            <Separator className="my-2" />
            <Row label={<b>Total</b>} value={<b className="text-lg text-[#8b1e3f]">{rupee(total)}</b>} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------- ORDER SUCCESS ----------
function OrderSuccessDialog({ order, onClose }) {
  if (!order) return null
  const copyOrder = () => { navigator.clipboard.writeText(order.orderNumber); toast.success('Order number copied') }
  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <div className="text-center py-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.6 }} className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold mt-4">Order Confirmed!</h2>
          <p className="text-neutral-600 text-sm mt-1">Thank you for shopping with Jigyasa Fabrics</p>

          <div className="mt-5 bg-neutral-50 rounded-lg p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Order Number</span>
              <button onClick={copyOrder} className="font-semibold text-[#8b1e3f] hover:underline flex items-center gap-1">
                {order.orderNumber} <Copy className="h-3 w-3" />
              </button>
            </div>
            <div className="flex justify-between"><span className="text-neutral-500">Amount</span><span className="font-semibold">{rupee(order.total)}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Payment</span><span className="font-semibold">{order.payment.method}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">AWB / Tracking</span><span className="font-mono text-xs">{order.awb}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Delivery by</span><span className="font-semibold">{new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></div>
          </div>

          <div className="mt-4 text-xs text-neutral-500 flex items-center justify-center gap-2">
            <PhoneCall className="h-3 w-3" /> A confirmation SMS will be sent to {order.address.phone}
          </div>

          <Button onClick={onClose} className="w-full mt-5 bg-[#8b1e3f] hover:bg-[#701731]">Continue Shopping</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------- TRUST STRIP ----------
function TrustStrip() {
  const items = [
    { icon: Truck, title: 'Pan-India Delivery', desc: 'Reaches 27,000+ pincodes' },
    { icon: ShieldCheck, title: '100% Authentic', desc: 'Direct from mills & artisans' },
    { icon: IndianRupee, title: 'GST Invoice', desc: 'B2C & B2B GSTIN supported' },
    { icon: Package, title: 'Easy Returns', desc: '7-day return policy' },
  ]
  return (
    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map(it => (
        <Card key={it.title} className="border-neutral-200">
          <CardContent className="p-4 text-center">
            <it.icon className="h-6 w-6 mx-auto text-[#8b1e3f]" />
            <div className="font-semibold text-sm mt-2">{it.title}</div>
            <div className="text-xs text-neutral-500">{it.desc}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ---------- FOOTER ----------
function Footer() {
  return (
    <footer className="mt-16 bg-neutral-900 text-neutral-300">
      <div className="container mx-auto px-4 py-10 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#8b1e3f] to-[#c14b6c] flex items-center justify-center text-white font-bold">J</div>
            <div className="font-bold text-white">Jigyasa Fabrics</div>
          </div>
          <p className="text-sm mt-3 text-neutral-400">{BRAND.tag}</p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Shop</h4>
          <ul className="space-y-1 text-sm text-neutral-400">
            <li>Sarees</li><li>Suit Sets</li><li>Cotton Fabric</li><li>Silk Fabric</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Help</h4>
          <ul className="space-y-1 text-sm text-neutral-400">
            <li>Track Order</li><li>Returns</li><li>Contact</li><li>FAQs</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Contact</h4>
          <ul className="space-y-1 text-sm text-neutral-400">
            <li>www.jigyasafabrics.in</li>
            <li>support@jigyasafabrics.in</li>
            <li>+91 98XXX XXXXX</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-800 py-4 text-center text-xs text-neutral-500">
        © 2025 Jigyasa Fabrics. All rights reserved. GSTIN: XXAAAAA0000A1Z5
      </div>
    </footer>
  )
}

export default App
