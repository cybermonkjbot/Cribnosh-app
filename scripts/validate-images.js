const fs = require('fs');
const path = require('path');
const https = require('https');

// All internet images found in the project
const imagesToValidate = [
  // Random User API (avatars)
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/45.jpg',
  'https://randomuser.me/api/portraits/men/46.jpg',
  'https://randomuser.me/api/portraits/women/47.jpg',
  
  // Pravatar API
  'https://i.pravatar.cc/32?img=7',
  'https://i.pravatar.cc/44?img=7',
  
  // Unsplash Images
  'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=180&h=120&fit=crop',
  'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=120&h=160&fit=crop',
  'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=120&h=160&fit=crop',
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=120&h=160&fit=crop',
  'https://images.unsplash.com/photo-1565958911770-bed387754dfa?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=100&fit=crop',
  
  // Video sources (for reference)
  'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
];

// Alternative working images
const alternativeImages = {
  // Food/Kitchen related alternatives
  'food-1': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
  'food-2': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
  'food-3': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
  'food-4': 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop',
  'food-5': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
  'food-6': 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=300&fit=crop',
  
  // Avatar alternatives
  'avatar-1': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face',
  'avatar-2': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
  'avatar-3': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
  'avatar-4': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
  
  // Working video alternatives
  'video-1': 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
  'video-2': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
};

function checkImage(url) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ url, valid: false, error: 'Timeout' });
    }, 10000);

    https.get(url, (res) => {
      clearTimeout(timeout);
      if (res.statusCode === 200) {
        resolve({ url, valid: true });
      } else {
        resolve({ url, valid: false, error: `HTTP ${res.statusCode}` });
      }
    }).on('error', (err) => {
      clearTimeout(timeout);
      resolve({ url, valid: false, error: err.message });
    });
  });
}

async function validateImages() {
  console.log('🔍 Validating all internet images...\n');
  
  const results = [];
  const invalidImages = [];
  
  for (const imageUrl of imagesToValidate) {
    console.log(`Checking: ${imageUrl}`);
    const result = await checkImage(imageUrl);
    results.push(result);
    
    if (result.valid) {
      console.log('✅ Valid');
    } else {
      console.log(`❌ Invalid: ${result.error}`);
      invalidImages.push(result);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`Total images: ${imagesToValidate.length}`);
  console.log(`Valid: ${results.filter(r => r.valid).length}`);
  console.log(`Invalid: ${invalidImages.length}`);
  
  if (invalidImages.length > 0) {
    console.log('\n❌ Invalid images found:');
    invalidImages.forEach(img => {
      console.log(`- ${img.url} (${img.error})`);
    });
    
    console.log('\n🔄 Suggested replacements:');
    console.log('For food/kitchen images, use these working alternatives:');
    Object.entries(alternativeImages).forEach(([key, url]) => {
      console.log(`- ${key}: ${url}`);
    });
  } else {
    console.log('\n🎉 All images are valid!');
  }
  
  return { results, invalidImages };
}

// File replacement mapping for common patterns
const fileReplacements = {
  // Replace invalid avatar URLs with working alternatives
  'https://randomuser.me/api/portraits/men/32.jpg': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
  'https://randomuser.me/api/portraits/women/44.jpg': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face',
  'https://randomuser.me/api/portraits/men/45.jpg': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
  'https://randomuser.me/api/portraits/men/46.jpg': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
  'https://randomuser.me/api/portraits/women/47.jpg': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face',
  
  // Replace pravatar with Unsplash alternatives
  'https://i.pravatar.cc/32?img=7': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face',
  'https://i.pravatar.cc/44?img=7': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=44&h=44&fit=crop&crop=face',
};

async function replaceInvalidImages() {
  console.log('\n🔄 Replacing invalid images in files...\n');
  
  const filesToCheck = [
    'components/ui/Header.tsx',
    'components/ui/CribnoshLiveHeader.tsx',
    'components/KitchenNameCard.tsx',
    'app/ui-test.tsx',
    'components/ui/MainScreen.tsx',
    'components/ui/LiveContent.tsx',
    'components/ui/KitchensNearMe.tsx',
    'components/ui/OrderAgainSection.tsx',
    'components/ui/TakeAways.tsx',
    'components/ui/TooFreshToWaste.tsx',
    'components/ui/TopKebabs.tsx',
    'components/ui/EventBanner.tsx',
    'components/ui/CuisinesSection.tsx'
  ];
  
  let totalReplacements = 0;
  
  for (const filePath of filesToCheck) {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      let fileReplacementsCount = 0;
      
      for (const [oldUrl, newUrl] of Object.entries(fileReplacements)) {
        if (content.includes(oldUrl)) {
          content = content.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
          fileReplacementsCount++;
          totalReplacements++;
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

// Run the validation
async function main() {
  try {
    const { invalidImages } = await validateImages();
    
    if (invalidImages.length > 0) {
      console.log('\n⚠️  Some images are invalid. Would you like to replace them? (y/n)');
      // For automated execution, we'll proceed with replacement
      await replaceInvalidImages();
    }
  } catch (error) {
    console.error('Error during validation:', error);
  }
}

// Export for use in other scripts
module.exports = { validateImages, replaceInvalidImages, checkImage };

// Run if called directly
if (require.main === module) {
  main();
} 