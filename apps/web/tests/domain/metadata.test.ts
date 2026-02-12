import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { generateMetadata } from '../../lib/utils'

describe('Domain Metadata Verification', () => {
    const originalEnv = process.env.NEXT_PUBLIC_BASE_URL

    beforeEach(() => {
        delete process.env.NEXT_PUBLIC_BASE_URL
    })

    afterEach(() => {
        if (originalEnv) {
            process.env.NEXT_PUBLIC_BASE_URL = originalEnv
        }
    })

    it('uses cribnosh.co.uk as default domain for metadata', () => {
        const metadata = generateMetadata({
            title: 'Test Title',
            description: 'Test Description',
            path: '/test-path'
        })

        expect(metadata.openGraph.url).toBe('https://cribnosh.co.uk/test-path')
        expect(metadata.alternates.canonical).toBe('https://cribnosh.co.uk/test-path')
        expect(metadata.openGraph.images[0].url).toBe('https://cribnosh.co.uk/opengraph-image')
    })

    it('still respects NEXT_PUBLIC_BASE_URL environment variable', () => {
        process.env.NEXT_PUBLIC_BASE_URL = 'https://custom-domain.com'
        const metadata = generateMetadata({
            title: 'Test Title',
            description: 'Test Description',
            path: '/test-path'
        })

        expect(metadata.openGraph.url).toBe('https://custom-domain.com/test-path')
    })
})
