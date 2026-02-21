const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const dirFile = path.join(dir, file);
        const dirent = fs.statSync(dirFile);
        if (dirent.isDirectory()) {
            if (file !== 'node_modules' && file !== '.expo' && file !== '.git') {
                filelist = walkSync(dirFile, filelist);
            }
        } else {
            if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
                filelist.push(dirFile);
            }
        }
    }
    return filelist;
};

const files = walkSync('/Users/joshua/Documents/Cribnosh-app/apps/mobile');

let totalReplaced = 0;
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Replacements
    // Imports / Components / Types
    content = content.replace(/KitchenMainScreen/g, 'FoodCreatorScreen');
    content = content.replace(/KitchenIntroCard/g, 'FoodCreatorIntroCard');
    content = content.replace(/KitchenBottomSheet/g, 'FoodCreatorBottomSheet');
    content = content.replace(/KitchenBottomSheetHeader/g, 'FoodCreatorBottomSheetHeader');
    content = content.replace(/KitchenBottomSheetContent/g, 'FoodCreatorBottomSheetContent');
    content = content.replace(/KitchenSkeletons/g, 'FoodCreatorSkeletons');
    content = content.replace(/KitchenRating/g, 'FoodCreatorRating');
    content = content.replace(/KitchensNearMe/g, 'FoodCreatorsNearMe');
    content = content.replace(/KitchensNearMeSkeleton/g, 'FoodCreatorsNearMeSkeleton');
    content = content.replace(/KitchensNearMeEmpty/g, 'FoodCreatorsNearMeEmpty');
    content = content.replace(/FeaturedKitchensSection/g, 'FeaturedFoodCreatorsSection');
    content = content.replace(/FeaturedKitchensSectionSkeleton/g, 'FeaturedFoodCreatorsSectionSkeleton');
    content = content.replace(/FeaturedKitchensSectionEmpty/g, 'FeaturedFoodCreatorsSectionEmpty');
    content = content.replace(/FeaturedKitchensDrawer/g, 'FeaturedFoodCreatorsDrawer');
    content = content.replace(/KitchenInfo/g, 'FoodCreatorInfo');
    content = content.replace(/KitchenInfoSkeleton/g, 'FoodCreatorInfoSkeleton');
    content = content.replace(/KitchenNameCard/g, 'FoodCreatorNameCard');

    // Variables/Properties
    content = content.replace(/Kitchen/g, 'FoodCreator');
    content = content.replace(/kitchens/g, 'foodCreators');
    // Avoid replacing kitchen inside strings if possible, but the user requested "rename everything about kitchens to be just food creators", so we'll just do global
    content = content.replace(/kitchen/g, 'foodCreator');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        totalReplaced++;
    }
}

console.log(`Replaced references in ${totalReplaced} files.`);
