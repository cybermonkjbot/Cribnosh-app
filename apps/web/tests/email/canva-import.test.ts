import { describe, expect, it } from 'vitest';
import { processCanvaHtml } from '../../lib/email/utils/canva-import';

describe('processCanvaHtml', () => {
    const imageMap = {
        'hero.png': 'https://convex.url/api/storage/hero-id',
        'logo.jpg': 'https://convex.url/api/storage/logo-id',
        'bg-image.jpeg': 'https://convex.url/api/storage/bg-id',
        'icon1.png': 'https://convex.url/api/storage/icon1-id',
        'icon11.png': 'https://convex.url/api/storage/icon11-id',
    };

    it('should replace src attributes with double quotes', () => {
        const html = '<img src="images/hero.png" alt="Hero">';
        const processed = processCanvaHtml(html, imageMap);
        expect(processed).toBe('<img src="https://convex.url/api/storage/hero-id" alt="Hero">');
    });

    it('should replace src attributes with single quotes', () => {
        const html = "<img src='logo.jpg' />";
        const processed = processCanvaHtml(html, imageMap);
        expect(processed).toBe("<img src='https://convex.url/api/storage/logo-id' />");
    });

    it('should replace background attributes', () => {
        const html = '<table background="images/bg-image.jpeg"><tr><td>Test</td></tr></table>';
        const processed = processCanvaHtml(html, imageMap);
        expect(processed).toBe('<table background="https://convex.url/api/storage/bg-id"><tr><td>Test</td></tr></table>');
    });

    it('should replace CSS background-image url()', () => {
        const html = '<div style="background-image: url(images/bg-image.jpeg); height: 100px;"></div>';
        const processed = processCanvaHtml(html, imageMap);
        expect(processed).toBe('<div style="background-image: url(https://convex.url/api/storage/bg-id); height: 100px;"></div>');
    });

    it('should handle filename overlaps correctly (longer first)', () => {
        const html = '<img src="icon1.png"><img src="icon11.png">';
        const processed = processCanvaHtml(html, imageMap);
        expect(processed).toContain('icon1-id');
        expect(processed).toContain('icon11-id');
        expect(processed).not.toContain('icon1-id1.png'); // Ensure "icon1.png" didn't partially match "icon11.png"
    });

    it('should handle various whitespaces in attributes', () => {
        const html = '<img   src  =  "hero.png" >';
        const processed = processCanvaHtml(html, imageMap);
        expect(processed).toBe('<img   src="https://convex.url/api/storage/hero-id" >');
    });

    it('should handle unquoted parameters in url()', () => {
        const html = 'style="background: url( images/hero.png )"';
        const processed = processCanvaHtml(html, imageMap);
        expect(processed).toBe('style="background: url(https://convex.url/api/storage/hero-id)"');
    });
});
