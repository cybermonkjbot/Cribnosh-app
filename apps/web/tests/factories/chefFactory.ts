export type TestChef = {
  id: string
  name: string
  cuisine: string
  rating: number
  location: string
  isAvailable: boolean
}

function randomId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${rand}`
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

const NAMES = ['Chef Maria', 'Chef Raj', 'Chef John', 'Chef Amina', 'Chef Chen']
const CUISINES = ['Italian', 'Indian', 'Nigerian', 'Chinese', 'Mexican']
const LOCATIONS = ['Birmingham', 'Nottingham', 'Leicester', 'Derby', 'Coventry']

export function generateChef(overrides: Partial<TestChef> = {}): TestChef {
  return {
    id: overrides.id ?? randomId('chef'),
    name: overrides.name ?? pick(NAMES),
    cuisine: overrides.cuisine ?? pick(CUISINES),
    rating: overrides.rating ?? Math.round((3 + Math.random() * 2) * 10) / 10,
    location: overrides.location ?? pick(LOCATIONS),
    isAvailable: overrides.isAvailable ?? Math.random() > 0.2,
  }
}