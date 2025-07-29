const fs = require('fs');
const path = require('path');
const https = require('https');

const fontsDir = path.join(__dirname, '../assets/fonts');

// Ensure fonts directory exists
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fonts = [
  {
    name: 'Mukta-Regular.ttf',
    url: 'https://fonts.gstatic.com/s/mukta/v7/iJWKBXyXfDDVXYnG6xKqXo3Q.woff2'
  },
  {
    name: 'Mukta-Bold.ttf',
    url: 'https://fonts.gstatic.com/s/mukta/v7/iJWHaXyXfDDVXYnG6xKqXo3Q.woff2'
  },
  {
    name: 'Mukta-ExtraBold.ttf',
    url: 'https://fonts.gstatic.com/s/mukta/v7/iJWHaXyXfDDVXYnG6xKqXo3Q.woff2'
  },
  {
    name: 'Inter-Regular.ttf',
    url: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
  },
  {
    name: 'Inter-Bold.ttf',
    url: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
  }
];

function downloadFont(font) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(fontsDir, font.name);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${font.name} already exists`);
      resolve();
      return;
    }

    console.log(`Downloading ${font.name}...`);
    
    const file = fs.createWriteStream(filePath);
    https.get(font.url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded ${font.name}`);
          resolve();
        });
      } else {
        console.log(`✗ Failed to download ${font.name}: ${response.statusCode}`);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if download failed
      console.log(`✗ Error downloading ${font.name}: ${err.message}`);
      reject(err);
    });
  });
}

async function downloadAllFonts() {
  console.log('Downloading ForkPrint fonts...\n');
  
  try {
    await Promise.all(fonts.map(downloadFont));
    console.log('\n✓ All fonts downloaded successfully!');
  } catch (error) {
    console.error('\n✗ Some fonts failed to download:', error.message);
    process.exit(1);
  }
}

downloadAllFonts(); 