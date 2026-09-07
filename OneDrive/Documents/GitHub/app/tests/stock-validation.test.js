const test = require('node:test')
const assert = require('node:assert/strict')

const { validateStock, decrementStock, calculateOrderTotals } = require('../lib/stock')

test('validateStock rejects orders exceeding product stock', () => {
  const products = [
    { id: 'p1', price: 200, stock: 2, name: 'Sample fabric' },
  ]

  assert.throws(() => {
    validateStock([{ id: 'p1', qty: 3 }], products)
  }, /stock.*available/i)
})

test('decrementStock reduces available stock for successful orders', () => {
  const products = [{ id: 'p1', name: 'Sample fabric', price: 200, stock: 5 }]

  const updated = decrementStock([{ id: 'p1', qty: 2 }], products)
  assert.equal(updated[0].stock, 3)
})

test('calculateOrderTotals applies tax and free shipping thresholds', () => {
  const items = [{ id: 'p1', name: 'Sample fabric', price: 1000, qty: 2 }]

  const totals = calculateOrderTotals(items)
  assert.equal(totals.subtotal, 2000)
  assert.equal(totals.shipping, 0)
  assert.equal(totals.tax, 100)
  assert.equal(totals.total, 2100)
})
