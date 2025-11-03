export type TestDish = {
  id: string
  name: string
  description: string
  price: number // smallest currency unit
  image: string
  chefId: string
  cuisine: string
  isAvailable: boolean
}

function randomId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${rand}`
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

const DISHES = [
  { name: 'Margherita Pizza', cuisine: 'italian' },
  { name: 'Jollof Rice', cuisine: 'nigerian' },
  { name: 'Chicken Chow Mein', cuisine: 'chinese' },
  { name: 'Palak Paneer', cuisine: 'indian' },
  { name: 'Tacos al Pastor', cuisine: 'mexican' },
]

export function generateDish(overrides: Partial<TestDish> = {}): TestDish {
  const base = pick(DISHES)
  return {
    id: overrides.id ?? randomId('dish'),
    name: overrides.name ?? base.name,
    description: overrides.description ?? `${base.name} prepared with authentic flavors`,
    price: overrides.price ?? (1000 + Math.floor(Math.random() * 1500)),
    image: overrides.image ?? `/images/${base.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
    chefId: overrides.chefId ?? randomId('chef'),
    cuisine: overrides.cuisine ?? base.cuisine,
    isAvailable: overrides.isAvailable ?? Math.random() > 0.1,
  }
}