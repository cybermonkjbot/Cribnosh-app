import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render } from '@react-email/render'
import { Logo } from '@/lib/email/templates/components'
import { emailUrls } from '@/lib/email/utils/urls'
import React from 'react'

describe('Email Logo URL Configuration', () => {
  const originalEnv = process.env.NEXT_PUBLIC_BASE_URL

  beforeEach(() => {
    // Clear environment variable
    delete process.env.NEXT_PUBLIC_BASE_URL
  })

  afterEach(() => {
    // Restore original environment variable
    if (originalEnv) {
      process.env.NEXT_PUBLIC_BASE_URL = originalEnv
    }
  })

  it('uses default URL when NEXT_PUBLIC_BASE_URL is not set', async () => {
    const html = await render(React.createElement(Logo))
    expect(html).toContain('https://cribnosh.com/logo.svg')
  })

  it('uses NEXT_PUBLIC_BASE_URL when set', async () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://staging.cribnosh.com'
    const html = await render(React.createElement(Logo))
    expect(html).toContain('https://staging.cribnosh.com/logo.svg')
  })

  it('uses custom base URL for different environments', async () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://dev.cribnosh.com'
    const html = await render(React.createElement(Logo))
    expect(html).toContain('https://dev.cribnosh.com/logo.svg')
  })

  it('URL utility generates correct base URL', () => {
    expect(emailUrls.base).toBe('https://cribnosh.com')
  })

  it('URL utility uses environment variable when set', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://test.cribnosh.com'
    // Re-import to get fresh environment variable
    delete require.cache[require.resolve('@/lib/email/utils/urls')]
    const { emailUrls: testUrls } = require('@/lib/email/utils/urls')
    expect(testUrls.base).toBe('https://test.cribnosh.com')
  })

  it('maintains correct logo attributes', async () => {
    const html = await render(React.createElement(Logo, { width: 200, height: 50, alt: "Test Logo" }))
    expect(html).toContain('width="200"')
    expect(html).toContain('height="50"')
    expect(html).toContain('alt="Test Logo"')
  })
})
