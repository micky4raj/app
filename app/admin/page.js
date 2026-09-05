'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Package, ShoppingCart, LogOut, Plus, Edit3, Trash2,
  TrendingUp, IndianRupee, AlertTriangle, Search, Save, X, Eye, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const rupee = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)

const CATEGORIES = ['Saree', 'Suit Set', 'Cotton Fabric', 'Silk Fabric']
const UNITS = ['meter', 'piece', 'set']
const ORDER_STATUSES = ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']

const STATUS_COLORS = {
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-amber-100 text-amber-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

function AdminApp() {
  const [token, setToken] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('jf_admin_token')
    if (t) setToken(t)
    setReady(true)
  }, [])

  const login = (t) => {
    localStorage.setItem('jf_admin_token', t)
    setToken(t)
  }
  const logout = () => {
    localStorage.removeItem('jf_admin_token')
    setToken(null)
  }

  if (!ready) return null
  if (!token) return <LoginScreen onLogin={login} />
  return <Dashboard token={token} onLogout={logout} />
}

// ---------- LOGIN ----------
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const d = await r.json()
      if (d.ok) {
        toast.success('Welcome back, admin!')
        onLogin(d.token)
      } else {
        toast.error(d.error || 'Invalid password')
      }
    } catch { toast.error('Network error') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8b1e3f] via-[#a02650] to-[#c14b6c] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-[#8b1e3f] to-[#c14b6c] flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            J
          </div>
          <h1 className="mt-4 text-2xl font-bold">Jigyasa Admin</h1>
          <p className="text-neutral-500 text-sm mt-1">Sign in to manage your store</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-xs">Admin Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              className="mt-1"
            />
            <p className="text-[10px] text-neutral-400 mt-1">Default: admin123 (change in .env)</p>
          </div>
          <Button type="submit" disabled={!password || loading} className="w-full bg-[#8b1e3f] hover:bg-[#701731] h-11">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          <a href="/" className="block text-center text-xs text-neutral-500 hover:text-[#8b1e3f]">
            ← Back to storefront
          </a>
        </form>
      </motion.div>
    </div>
  )
}

// ---------- DASHBOARD ----------
function Dashboard({ token, onLogout }) {
  const [tab, setTab] = useState('overview')

  const authFetch = async (url, opts = {}) => {
    const r = await fetch(url, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
    })
    if (r.status === 401) { onLogout(); throw new Error('Session expired') }
    return r
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#8b1e3f] to-[#c14b6c] flex items-center justify-center text-white font-bold shadow">
              J
            </div>
            <div>
              <div className="font-bold text-sm">Jigyasa Admin</div>
              <div className="text-[10px] text-neutral-500">Store Management Console</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/" target="_blank"><Eye className="h-4 w-4 mr-2" /> View Store</a>
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="overview"><LayoutDashboard className="h-4 w-4 mr-2" /> Overview</TabsTrigger>
            <TabsTrigger value="products"><Package className="h-4 w-4 mr-2" /> Products</TabsTrigger>
            <TabsTrigger value="orders"><ShoppingCart className="h-4 w-4 mr-2" /> Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewPanel authFetch={authFetch} /></TabsContent>
          <TabsContent value="products"><ProductsPanel authFetch={authFetch} /></TabsContent>
          <TabsContent value="orders"><OrdersPanel authFetch={authFetch} /></TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// ---------- OVERVIEW ----------
function OverviewPanel({ authFetch }) {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, o] = await Promise.all([
        authFetch('/api/admin/stats').then(r => r.json()),
        authFetch('/api/admin/orders').then(r => r.json()),
      ])
      setStats(s)
      setRecent((o.orders || []).slice(0, 5))
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const cards = stats ? [
    { title: 'Total Revenue', value: rupee(stats.revenue), icon: IndianRupee, color: 'from-green-500 to-emerald-600' },
    { title: 'Total Orders', value: stats.orderCount, icon: ShoppingCart, color: 'from-blue-500 to-indigo-600' },
    { title: 'Products', value: stats.productCount, icon: Package, color: 'from-purple-500 to-fuchsia-600' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Dashboard Overview</h2>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-lg border animate-pulse" />
        )) : cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                  <c.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold mt-3">{c.value}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{c.title}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {stats?.lowStock > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div className="text-sm">
            <b>{stats.lowStock}</b> product(s) have low stock (below 20 units). Consider restocking soon.
          </div>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-neutral-500">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map(o => (
                <div key={o.orderNumber} className="flex items-center justify-between border rounded-lg p-3 hover:bg-neutral-50">
                  <div>
                    <div className="font-semibold text-sm">{o.orderNumber}</div>
                    <div className="text-xs text-neutral-500">{o.address?.name} • {new Date(o.createdAt).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-1 rounded font-medium ${STATUS_COLORS[o.status] || 'bg-neutral-100'}`}>{o.status}</span>
                    <div className="font-bold">{rupee(o.total)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- PRODUCTS ----------
const EMPTY_PRODUCT = {
  name: '', category: 'Saree', fabric: '', unit: 'piece',
  price: '', mrp: '', image: '', gsm: '', weave: '', stock: '',
  rating: 4.5, ratingCount: 0, colors: '', description: '', bestSeller: false,
}

function ProductsPanel({ authFetch }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | product object

  const load = async () => {
    setLoading(true)
    try {
      const d = await authFetch('/api/admin/products').then(r => r.json())
      setProducts(d.products || [])
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async (form) => {
    try {
      const isNew = !form.id
      const url = isNew ? '/api/admin/products' : `/api/admin/products/${form.id}`
      const method = isNew ? 'POST' : 'PUT'
      const r = await authFetch(url, { method, body: JSON.stringify(form) })
      const d = await r.json()
      if (d.ok) {
        toast.success(isNew ? 'Product created' : 'Product updated')
        setEditing(null)
        load()
      } else {
        toast.error(d.error || 'Failed')
      }
    } catch { toast.error('Failed to save') }
  }

  const remove = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await authFetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      toast.success('Product deleted')
      load()
    } catch { toast.error('Failed') }
  }

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold">Products ({products.length})</h2>
        <div className="flex gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => setEditing('new')} className="bg-[#8b1e3f] hover:bg-[#701731]">
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-neutral-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b">
                  <tr className="text-left">
                    <th className="p-3">Product</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Rating</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b hover:bg-neutral-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt="" className="h-10 w-10 rounded object-cover bg-neutral-100" />
                          <div className="min-w-0">
                            <div className="font-medium line-clamp-1">{p.name}</div>
                            <div className="text-xs text-neutral-500">{p.fabric} • per {p.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3"><Badge variant="outline">{p.category}</Badge></td>
                      <td className="p-3">
                        <div className="font-semibold">{rupee(p.price)}</div>
                        <div className="text-xs text-neutral-400 line-through">{rupee(p.mrp)}</div>
                      </td>
                      <td className="p-3">
                        <span className={p.stock < 20 ? 'text-red-600 font-semibold' : ''}>{p.stock}</span>
                      </td>
                      <td className="p-3">{p.rating} ★ ({p.ratingCount})</td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(p)}><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(p.id, p.name)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductEditor
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={save}
      />
    </div>
  )
}

function ProductEditor({ editing, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_PRODUCT)

  useEffect(() => {
    if (editing === 'new') setForm({ ...EMPTY_PRODUCT })
    else if (editing && typeof editing === 'object') {
      setForm({ ...editing, colors: Array.isArray(editing.colors) ? editing.colors.join(', ') : editing.colors || '' })
    }
  }, [editing])

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isValid = form.name && form.image && form.price && form.mrp

  return (
    <Dialog open={!!editing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing === 'new' ? 'Add New Product' : 'Edit Product'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-xs">Product Name *</Label><Input value={form.name} onChange={e => update('name', e.target.value)} /></div>
          <div className="col-span-2"><Label className="text-xs">Image URL *</Label><Input value={form.image} onChange={e => update('image', e.target.value)} placeholder="https://..." /></div>
          {form.image && <div className="col-span-2"><img src={form.image} className="h-32 rounded border object-cover" alt="preview" /></div>}
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={form.category} onValueChange={v => update('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Sold Per</Label>
            <Select value={form.unit} onValueChange={v => update('unit', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Fabric</Label><Input value={form.fabric} onChange={e => update('fabric', e.target.value)} placeholder="e.g. Cotton, Silk" /></div>
          <div><Label className="text-xs">Weave</Label><Input value={form.weave} onChange={e => update('weave', e.target.value)} /></div>
          <div><Label className="text-xs">Price (₹) *</Label><Input type="number" value={form.price} onChange={e => update('price', e.target.value)} /></div>
          <div><Label className="text-xs">MRP (₹) *</Label><Input type="number" value={form.mrp} onChange={e => update('mrp', e.target.value)} /></div>
          <div><Label className="text-xs">Stock</Label><Input type="number" value={form.stock} onChange={e => update('stock', e.target.value)} /></div>
          <div><Label className="text-xs">GSM</Label><Input type="number" value={form.gsm} onChange={e => update('gsm', e.target.value)} /></div>
          <div><Label className="text-xs">Rating</Label><Input type="number" step="0.1" value={form.rating} onChange={e => update('rating', e.target.value)} /></div>
          <div><Label className="text-xs">Rating Count</Label><Input type="number" value={form.ratingCount} onChange={e => update('ratingCount', e.target.value)} /></div>
          <div className="col-span-2"><Label className="text-xs">Colors (comma-separated)</Label><Input value={form.colors} onChange={e => update('colors', e.target.value)} placeholder="Red, Gold, Maroon" /></div>
          <div className="col-span-2"><Label className="text-xs">Description</Label><Textarea rows={3} value={form.description} onChange={e => update('description', e.target.value)} /></div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={form.bestSeller} onChange={e => update('bestSeller', e.target.checked)} id="best" className="accent-[#8b1e3f]" />
            <Label htmlFor="best" className="text-sm cursor-pointer">Mark as Bestseller</Label>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1"><X className="h-4 w-4 mr-1" /> Cancel</Button>
          <Button disabled={!isValid} onClick={() => onSave(form)} className="flex-1 bg-[#8b1e3f] hover:bg-[#701731]">
            <Save className="h-4 w-4 mr-1" /> Save Product
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------- ORDERS ----------
function OrdersPanel({ authFetch }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const d = await authFetch('/api/admin/orders').then(r => r.json())
      setOrders(d.orders || [])
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const updateStatus = async (orderNumber, status) => {
    try {
      const r = await authFetch(`/api/admin/orders/${orderNumber}`, {
        method: 'PUT', body: JSON.stringify({ status }),
      })
      const d = await r.json()
      if (d.ok) {
        toast.success(`Order ${orderNumber} → ${status}`)
        setOrders(prev => prev.map(o => o.orderNumber === orderNumber ? { ...o, status } : o))
        if (viewing?.orderNumber === orderNumber) setViewing({ ...viewing, status })
      }
    } catch { toast.error('Failed') }
  }

  const filtered = orders.filter(o =>
    !search ||
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.address?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.address?.phone?.includes(search)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold">Orders ({orders.length})</h2>
        <div className="flex gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input placeholder="Search by order#, name, phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-neutral-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b">
                  <tr className="text-left">
                    <th className="p-3">Order #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.orderNumber} className="border-b hover:bg-neutral-50">
                      <td className="p-3 font-mono font-semibold">{o.orderNumber}</td>
                      <td className="p-3">
                        <div className="font-medium">{o.address?.name}</div>
                        <div className="text-xs text-neutral-500">{o.address?.phone} • {o.address?.city}</div>
                      </td>
                      <td className="p-3">{o.items?.length || 0}</td>
                      <td className="p-3 font-semibold">{rupee(o.total)}</td>
                      <td className="p-3"><Badge variant="outline">{o.payment?.method}</Badge></td>
                      <td className="p-3">
                        <Select value={o.status} onValueChange={(v) => updateStatus(o.orderNumber, v)}>
                          <SelectTrigger className={`w-40 h-8 text-xs ${STATUS_COLORS[o.status] || ''}`}><SelectValue /></SelectTrigger>
                          <SelectContent>{ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setViewing(o)}><Eye className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailDialog order={viewing} onClose={() => setViewing(null)} onUpdateStatus={updateStatus} />
    </div>
  )
}

function OrderDetailDialog({ order, onClose, onUpdateStatus }) {
  if (!order) return null
  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Order {order.orderNumber}
            <span className={`text-[10px] px-2 py-1 rounded font-medium ${STATUS_COLORS[order.status] || 'bg-neutral-100'}`}>{order.status}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-neutral-50 rounded-lg p-3">
            <div className="font-semibold mb-2">Customer</div>
            <div>{order.address?.name}</div>
            <div className="text-neutral-500">{order.address?.phone}</div>
            <div className="text-neutral-500 text-xs mt-1">{order.address?.line1}, {order.address?.city}, {order.address?.state} - {order.address?.pincode}</div>
            {order.address?.gstin && <div className="text-xs mt-1"><b>GSTIN:</b> {order.address.gstin}</div>}
          </div>
          <div className="bg-neutral-50 rounded-lg p-3">
            <div className="font-semibold mb-2">Shipping</div>
            <div><b>AWB:</b> <span className="font-mono">{order.awb}</span></div>
            <div><b>Payment:</b> {order.payment?.method} ({order.payment?.status})</div>
            <div><b>Placed:</b> {new Date(order.createdAt).toLocaleString('en-IN')}</div>
            <div><b>ETA:</b> {new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="font-semibold text-sm mb-2">Items ({order.items?.length})</div>
          <div className="space-y-2">
            {order.items?.map((i, idx) => (
              <div key={idx} className="flex items-center gap-3 border rounded p-2">
                {i.image && <img src={i.image} className="h-12 w-12 rounded object-cover" alt="" />}
                <div className="flex-1">
                  <div className="font-medium text-sm">{i.name}</div>
                  <div className="text-xs text-neutral-500">Qty: {i.qty} × {rupee(i.price)}</div>
                </div>
                <div className="font-semibold">{rupee(i.price * i.qty)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 bg-neutral-50 rounded-lg p-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{rupee(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{order.shipping === 0 ? 'FREE' : rupee(order.shipping)}</span></div>
          <div className="flex justify-between"><span>GST</span><span>{rupee(order.tax)}</span></div>
          <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span>{rupee(order.total)}</span></div>
        </div>
        <div className="mt-4">
          <Label className="text-xs">Update Status</Label>
          <Select value={order.status} onValueChange={(v) => onUpdateStatus(order.orderNumber, v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AdminApp
