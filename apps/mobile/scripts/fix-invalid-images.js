const fs = require('fs');

// Invalid images and their replacements
const replacements = {
  // Replace the invalid Unsplash image with a working alternative
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136',
  
  // Replace the invalid avatar image with a working alternative
  'https://images.unsplash.com/photo-1494790108755-2616b612b786': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
};

// Files to check and update
const filesToUpdate = [
  'components/ui/MainScreen.tsx',
  'components/ui/LiveContent.tsx',
  'components/ui/KitchensNearMe.tsx',
  'components/ui/CuisinesSection.tsx',
  'components/ui/TopKebabs.tsx',
  'components/ui/OrderAgainSection.tsx',
  'app/ui-test.tsx'
];

function replaceInvalidImages() {
  console.log('🔄 Replacing invalid images...\n');
  
  let totalReplacements = 0;
  
  for (const filePath of filesToUpdate) {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      let fileReplacementsCount = 0;
      
      for (const [oldUrl, newUrl] of Object.entries(replacements)) {
        // Create regex patterns for different URL variations
        const patterns = [
          new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\?w=\\d+&h=\\d+&fit=crop', 'g'),
          new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\?w=\\d+&h=\\d+&fit=crop&crop=face', 'g'),
        ];
        
        for (const pattern of patterns) {
          const matches = content.match(pattern);
          if (matches) {
            content = content.replace(pattern, (match) => {
              // Preserve the original query parameters
              const queryParams = match.split('?')[1];
              return newUrl + '?' + queryParams;
            });
            fileReplacementsCount += matches.length;
            totalReplacements += matches.length;
          }
        }
      }
      
      if (fileReplacementsCount > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated ${filePath} (${fileReplacementsCount} replacements)`);
      }
    }
  }
  
  console.log(`\n🎉 Total replacements made: ${totalReplacements}`);
}

// Run the replacement
replaceInvalidImages(); 