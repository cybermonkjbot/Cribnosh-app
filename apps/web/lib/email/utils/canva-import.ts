/**
 * Utility to process Canva-exported HTML and replace image paths with Convex storage URLs.
 */

/**
 * Robustly replaces image references in HTML content.
 * Handles:
 * - src="..."
 * - background="..."
 * - background-image: url(...) in style attributes
 * 
 * @param html The original HTML content from Canva.
 * @param imageMap A record mapping local filenames (from ZIP) to hosted public URLs.
 */
export function processCanvaHtml(html: string, imageMap: Record<string, string>): string {
    let processedHtml = html;

    // Sort filenames by length descending to avoid partial matching issues
    // e.g., "image1.png" matching "image11.png" if "image1.png" was replaced first.
    const filenames = Object.keys(imageMap).sort((a, b) => b.length - a.length);

    for (const filename of filenames) {
        const publicUrl = imageMap[filename];
        const escapedName = escapeRegex(filename);

        // 1. Match src attributes: src="...", src='...', src=...
        // Pattern: src\s*=\s*(["'])?[^"']*?filename\1?
        const srcRegex = new RegExp(`src\\s*=\\s*(["'])?[^"']*?${escapedName}\\1`, 'gi');
        processedHtml = processedHtml.replace(srcRegex, (match, quote) => {
            const q = quote || '"';
            return `src=${q}${publicUrl}${q}`;
        });

        // 2. Match background attributes (legacy but Canva might use them)
        const bgRegex = new RegExp(`background\\s*=\\s*(["'])?[^"']*?${escapedName}\\1`, 'gi');
        processedHtml = processedHtml.replace(bgRegex, (match, quote) => {
            const q = quote || '"';
            return `background=${q}${publicUrl}${q}`;
        });

        // 3. Match CSS background-image: url(...)
        // Pattern: background-image\s*:\s*url\((["'])?[^)]*?filename\1?\)
        const cssBgRegex = new RegExp(`url\\s*\\(\\s*(["'])?[^)]*?${escapedName}\\1?\\s*\\)`, 'gi');
        processedHtml = processedHtml.replace(cssBgRegex, (match, quote) => {
            return `url(${publicUrl})`;
        });
    }

    return processedHtml;
}

function escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
