/**
 * Script to replace all react-native-reanimated imports with the wrapper
 * Run with: node scripts/fix-reanimated-imports.js
 */

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'components/ui/ScrollBreakpointTester.tsx',
  'components/ui/PremiumTabs.tsx',
  'components/ui/OrderCard.tsx',
  'components/ui/GradientBackground.tsx',
  'components/ui/TiltCard.tsx',
  'components/ui/OnTheStoveBottomSheetSkeleton.tsx',
  'components/ui/NoshMagicPortal.tsx',
  'components/ui/MealsLoggedCard.tsx',
  'components/ui/MealVideoCardSkeleton.tsx',
  'components/ui/MealVideoCard.tsx',
  'components/ui/LiveChatDrawer.tsx',
  'components/ui/GachaMealSpinner.tsx',
  'components/ui/CuisineScoreCard.tsx',
  'components/ui/CalorieCompareCard.tsx',
  'components/ui/AnimatedMoodButton.tsx',
  'app/(tabs)/orders/index.tsx',
  'app/custom-order-management.tsx',
  'app/(tabs)/profile.tsx',
  'components/SwipeButton.tsx',
  'components/ParallaxScrollView.tsx',
  'components/HelloWave.tsx',
];

function updateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Replace both single and double quotes
  content = content.replace(
    /from\s+['"]react-native-reanimated['"]/g,
    "from '@/utils/reanimatedWrapper'"
  );

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
    return false;
  }
}

console.log('🔧 Fixing react-native-reanimated imports...\n');

let updatedCount = 0;
filesToUpdate.forEach(file => {
  if (updateFile(file)) {
    updatedCount++;
  }
});

console.log(`\n✅ Updated ${updatedCount} files`);



