export type TestPaymentIntent = {
  id: string
  amount: number
  currency: 'gbp'
  status: 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded' | 'canceled'
  client_secret: string
}

function randomId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${rand}`
}

export function generatePaymentIntent(overrides: Partial<TestPaymentIntent> = {}): TestPaymentIntent {
  const id = overrides.id ?? randomId('pi')
  return {
    id,
    amount: overrides.amount ?? 2500,
    currency: overrides.currency ?? 'gbp',
    status: overrides.status ?? 'requires_payment_method',
    client_secret: overrides.client_secret ?? `${id}_secret_${Math.random().toString(36).slice(2, 6)}`,
  }
}