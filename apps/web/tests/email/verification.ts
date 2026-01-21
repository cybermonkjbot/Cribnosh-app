import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || '';
const httpClient = new ConvexHttpClient(CONVEX_URL);

async function testEmailSystem() {
    console.log('--- Email System Verification ---');

    try {
        // 1. Seed Templates
        console.log('Step 1: Seeding templates...');
        const seedResult = await httpClient.mutation(api.mutations.seedTemplates.seedTemplates, {});
        console.log('Seed result:', seedResult);

        // 2. Test Rendering/Fetching via sendTemplateEmail (dry run check)
        // Note: Since sendTemplateEmail actually sends an email, we verify the query side first
        console.log('Step 2: Checking template existence...');
        const templates = await httpClient.query(api.queries.emailConfig.getAllTemplates, {});
        const commonTypes = ['otp_verification', 'welcome_message', 'account_deletion'];

        for (const type of commonTypes) {
            const template = templates.find(t => t.emailType === type);
            if (template) {
                console.log(`✅ Found template for type: ${type}`);
            } else {
                console.log(`❌ Missing template for type: ${type}`);
            }
        }

        console.log('Verification check complete.');
    } catch (error) {
        console.error('Verification failed:', error);
    }
}

// In a real test environment, this would be part of a test suite
// testEmailSystem();
