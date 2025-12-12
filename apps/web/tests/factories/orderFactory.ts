export type TestOrderItem = {
  dishId: string
  name: string
  quantity: number
  price: number // smallest currency unit
}

export type TestOrder = {
  id: string
  customerId: string
  chefId: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  total: number
  currency: 'gbp'
  items: TestOrderItem[]
  createdAt: string
  updatedAt: string
}

function randomId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${rand}`
}

function nowIso(): string { return new Date().toISOString() }

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

const DISHES = [
  { id: 'dish_margherita', name: 'Margherita Pizza', price: 1800 },
  { id: 'dish_jollof', name: 'Jollof Rice', price: 1200 },
  { id: 'dish_chowmein', name: 'Chicken Chow Mein', price: 1500 },
  { id: 'dish_palak', name: 'Palak Paneer', price: 1400 },
]

export type GenerateOrderOptions = Partial<TestOrder> & {
  itemsCount?: number
}

export function generateOrder(options: GenerateOrderOptions = {}): TestOrder {
  const itemsCount = options.items?.length ?? options.itemsCount ?? Math.ceil(Math.random() * 3)
  const items: TestOrderItem[] = options.items ?? Array.from({ length: itemsCount }, () => {
    const dish = pick(DISHES)
    const qty = Math.ceil(Math.random() * 2)
    return { dishId: dish.id, name: dish.name, quantity: qty, price: dish.price }
  })

  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
  const createdAt = options.createdAt ?? nowIso()

  return {
    id: options.id ?? randomId('order'),
    customerId: options.customerId ?? randomId('user'),
    chefId: options.chefId ?? randomId('chef'),
    status: options.status ?? pick(['pending', 'confirmed', 'preparing', 'ready', 'completed']),
    total,
    currency: options.currency ?? 'gbp',
    items,
    createdAt,
    updatedAt: options.updatedAt ?? createdAt,
  }
}

export function generateOrders(count: number, options: GenerateOrderOptions = {}): TestOrder[] {
  return Array.from({ length: count }, () => generateOrder(options))
}