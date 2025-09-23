const fs = require('fs');
const path = require('path');
const https = require('https');

// Create demo folder if it doesn't exist
const demoFolder = path.join(process.cwd(), 'assets', 'images', 'demo');
if (!fs.existsSync(demoFolder)) {
  fs.mkdirSync(demoFolder, { recursive: true });
}

// Avatar URLs to download
const avatarUrls = [
  'https://avatar.iran.liara.run/public/44',
  'https://avatar.iran.liara.run/public/47',
  'https://avatar.iran.liara.run/public/27',
  'https://avatar.iran.liara.run/public/12',
  'https://avatar.iran.liara.run/public/16'
];

// Download function
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(demoFolder, filename);
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Downloaded: ${filename}`);
          resolve();
        });
      } else {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
    
    file.on('error', (err) => {
      reject(err);
    });
  });
}

// Download all avatars
async function downloadAllAvatars() {
  console.log('🚀 Starting avatar download...');
  console.log(`📁 Saving to: ${demoFolder}`);
  
  try {
    for (let i = 0; i < avatarUrls.length; i++) {
      const url = avatarUrls[i];
      const filename = `avatar-${i + 1}.png`;
      await downloadImage(url, filename);
    }
    
    console.log('\n🎉 All avatars downloaded successfully!');
    console.log('\n📋 Generated local image paths:');
    avatarUrls.forEach((_, i) => {
      console.log(`require('@/assets/images/demo/avatar-${i + 1}.png')`);
    });
    
  } catch (error) {
    console.error('❌ Error downloading avatars:', error.message);
  }
}

downloadAllAvatars();
