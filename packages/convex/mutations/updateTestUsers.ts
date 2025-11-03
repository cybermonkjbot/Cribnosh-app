import { v } from 'convex/values';
import { mutation } from '../_generated/server';

export const updateTestUsers = mutation({
  args: {},
  handler: async (ctx) => {
    // Realistic names and email domains
    const realisticNames = [
      "Sarah Johnson", "Michael Chen", "Emily Rodriguez", "David Kim", "Lisa Thompson",
      "James Wilson", "Maria Garcia", "Robert Brown", "Jennifer Davis", "Christopher Lee",
      "Amanda White", "Daniel Martinez", "Jessica Taylor", "Matthew Anderson", "Ashley Thomas",
      "Andrew Jackson", "Stephanie Harris", "Kevin Clark", "Nicole Lewis", "Ryan Walker",
      "Michelle Hall", "Brandon Young", "Samantha King", "Justin Wright", "Rachel Green",
      "Tyler Adams", "Lauren Baker", "Jordan Turner", "Kayla Phillips", "Cameron Campbell",
      "Megan Parker", "Austin Evans", "Brittany Edwards", "Zachary Collins", "Hannah Stewart"
    ];
    
    const emailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"];
    
    // Get all users with @example.com emails
    const allUsers = await ctx.db.query("users").collect();
    const testUsers = allUsers.filter(user => 
      user.email && user.email.includes("@example.com")
    );
    
    console.log(`Found ${testUsers.length} test users to update`);
    
    const results = [];
    
    // Update each test user
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      const nameIndex = i % realisticNames.length;
      const domainIndex = i % emailDomains.length;
      
      const newName = realisticNames[nameIndex];
      const newEmail = `${newName.toLowerCase().replace(/\s+/g, '.')}@${emailDomains[domainIndex]}`;
      
      try {
        await ctx.db.patch(user._id, {
          name: newName,
          email: newEmail,
          lastModified: Date.now(),
        });
        
        results.push({
          userId: user._id,
          oldName: user.name,
          oldEmail: user.email,
          newName,
          newEmail,
          status: 'success'
        });
        
        console.log(`Updated ${user.name} (${user.email}) -> ${newName} (${newEmail})`);
      } catch (error) {
        results.push({
          userId: user._id,
          oldName: user.name,
          oldEmail: user.email,
          newName,
          newEmail,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        console.error(`Failed to update ${user.name}:`, error);
      }
    }
    
    return {
      totalProcessed: testUsers.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      results
    };
  },
});
