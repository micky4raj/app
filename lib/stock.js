function validateStock(items, products) {
  const productMap = new Map((products || []).map((product) => [product.id, product]))

  for (const item of items || []) {
    const product = productMap.get(item.id)
    if (!product) {
      throw new Error(`Product ${item.id} not found`)
    }

    const qty = Math.max(1, Number(item.qty) || 1)
    if (qty > Number(product.stock || 0)) {
      throw new Error(`Requested quantity exceeds stock available for ${product.name}`)
    }
  }

  return true
}

function decrementStock(items, products) {
  const productMap = new Map((products || []).map((product) => [product.id, product]))
  const requested = new Map()

  for (const item of items || []) {
    const product = productMap.get(item.id)
    if (!product) {
      throw new Error(`Product ${item.id} not found`)
    }

    const qty = Math.max(1, Number(item.qty) || 1)
    requested.set(item.id, (requested.get(item.id) || 0) + qty)
  }

  return (products || []).map((product) => {
    const qty = requested.get(product.id) || 0
    const remaining = Number(product.stock || 0) - qty
    if (remaining < 0) {
      throw new Error(`Requested quantity exceeds stock available for ${product.name}`)
    }

    return { ...product, stock: remaining }
  })
}

function calculateOrderTotals(items) {
  const subtotal = (items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * Math.max(1, Number(item.qty) || 1), 0)
  const shipping = subtotal > 999 ? 0 : 79
  const tax = Math.round(subtotal * 0.05)
  const total = subtotal + shipping + tax

  return { subtotal, shipping, tax, total }
}

module.exports = { validateStock, decrementStock, calculateOrderTotals }
