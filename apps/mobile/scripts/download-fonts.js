const fs = require('fs');
const path = require('path');
const https = require('https');

const fonts = [
  {
    name: 'ProtestStrike-Regular.ttf',
    url: 'https://fonts.gstatic.com/s/proteststrike/v1/ZXuie31Ugut69cMfWMsWswx_VkHkVDtVDg0jPFR5A7UvoDteZZHipA.ttf'
  },
  {
    name: 'Poppins-Regular.ttf',
    url: 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2'
  },
  {
    name: 'Poppins-SemiBold.ttf',
    url: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2'
  },
  {
    name: 'Poppins-Bold.ttf',
    url: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2'
  },
  {
    name: 'SFPro-Regular.ttf',
    url: 'https://developer.apple.com/fonts/sf-pro/SFPro-Regular.otf'
  },
  {
    name: 'SFPro-Medium.ttf',
    url: 'https://developer.apple.com/fonts/sf-pro/SFPro-Medium.otf'
  },
  {
    name: 'SFPro-SemiBold.ttf',
    url: 'https://developer.apple.com/fonts/sf-pro/SFPro-SemiBold.otf'
  },
  {
    name: 'SFPro-Bold.ttf',
    url: 'https://developer.apple.com/fonts/sf-pro/SFPro-Bold.otf'
  },
  {
    name: 'ADLaMDisplay-Regular.ttf',
    url: 'https://fonts.gstatic.com/s/adlamdisplay/v1/2sDcZGJLip7W2J7v7t0xECN4YFJBfw.woff2'
  },
  {
    name: 'Lato-Regular.ttf',
    url: 'https://fonts.gstatic.com/s/lato/v24/S6uy9ZBM6PHf6qXUaQw.woff2'
  }
];

const fontsDir = path.join(__dirname, '../assets/fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

function downloadFont(font) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(fontsDir, font.name);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${font.name} already exists`);
      resolve();
      return;
    }

    console.log(`📥 Downloading ${font.name}...`);
    
    const file = fs.createWriteStream(filePath);
    https.get(font.url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded ${font.name}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if download failed
      console.error(`❌ Failed to download ${font.name}:`, err.message);
      reject(err);
    });
  });
}

async function downloadAllFonts() {
  console.log('🚀 Starting font download...');
  
  try {
    for (const font of fonts) {
      await downloadFont(font);
    }
    console.log('🎉 All fonts downloaded successfully!');
  } catch (error) {
    console.error('💥 Error downloading fonts:', error);
    process.exit(1);
  }
}

downloadAllFonts(); 