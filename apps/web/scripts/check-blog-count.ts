import { config } from 'dotenv';
import * as path from 'path';
import { api, getConvexClient } from '../lib/conxed-client';

// Load environment variables
config({ path: path.join(process.cwd(), '.env.local') });

async function checkCount() {
    const convex = getConvexClient();
    try {
        const posts = await convex.query(api.queries.blog.getBlogPosts, { status: 'all' });
        console.log(`Total blog posts in Convex: ${posts?.length || 0}`);
        if (posts && posts.length > 0) {
            console.log('Sample posts:');
            posts.slice(0, 3).forEach((p: any) => {
                console.log(`- ${p.title} (${p.status})`);
            });
        }
    } catch (error) {
        console.error('Error querying Convex:', error);
    }
}

checkCount();
