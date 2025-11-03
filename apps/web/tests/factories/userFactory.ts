export type TestUser = {
  id: string
  email: string
  name: string
  roles: string[]
}

function randomId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${rand}`
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const FIRST_NAMES = ['John', 'Jane', 'Alex', 'Maria', 'Sam', 'Aisha', 'Kwame', 'Liu', 'Priya', 'Diego']
const LAST_NAMES = ['Doe', 'Smith', 'Johnson', 'Brown', 'Garcia', 'Kim', 'Patel', 'Chen', 'Abebe', 'Okoro']
const ROLES = ['customer', 'chef', 'admin', 'staff'] as const

export type GenerateUserOptions = Partial<TestUser> & { roles?: string[] }

export function generateUser(options: GenerateUserOptions = {}): TestUser {
  const firstName = options.name?.split(' ')[0] ?? pick(FIRST_NAMES)
  const lastName = options.name?.split(' ')[1] ?? pick(LAST_NAMES)
  const name = options.name ?? `${firstName} ${lastName}`
  const emailBase = name.toLowerCase().replace(/\s+/g, '.')

  return {
    id: options.id ?? randomId('user'),
    email: options.email ?? `${emailBase}@cribnosh.co.uk`,
    name,
    roles: options.roles ?? [pick([...ROLES])],
  }
}

export function generateUsers(count: number, options: GenerateUserOptions = {}): TestUser[] {
  return Array.from({ length: count }, () => generateUser(options))
}