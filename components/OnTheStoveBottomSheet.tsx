// import { ExternalLink } from 'lucide-react-native';
// import React, { useState } from 'react';
// import { Pressable, StyleSheet, Text, View } from 'react-native';
// import { BottomSheetBase } from './BottomSheetBase';
// import CompactMealSelection from './CompactMealSelection';
// import { AISparkles } from './ui/AISparkles';



// interface OnTheStoveBottomSheetProps {
//   isVisible: boolean;
//   onToggleVisibility: () => void;
//   onShareLive?: () => void;
//   onTreatSomeone?: () => void;
//   mealData?: {
//     title: string;
//     price: string;
//     imageSource: any;
//     description: string;
//     kitchenName: string;
//     ingredients?: string[];
//     cookingTime?: string;
//     chefBio?: string;
//     liveViewers?: number;
//   };
// }

// const OnTheStoveBottomSheet: React.FC<OnTheStoveBottomSheetProps> = ({
//   isVisible,
//   onToggleVisibility,
//   onShareLive,
//   onTreatSomeone,
//   mealData = {
//     title: 'Nigerian Jollof',
//     price: '£ 16',
//     imageSource: 'https://avatar.iran.liara.run/public/44',
//     description: 'Watch Chef Minnie craft authentic Nigerian Jollof Rice live! Fresh tomatoes, aromatic spices, and perfectly seasoned rice - order now before it\'s ready.',
//     kitchenName: 'Minnies Kitchen',
//     ingredients: ['Premium Basmati Rice', 'Fresh Tomatoes', 'Bell Peppers', 'Red Onions', 'Secret Spice Blend'],
//     cookingTime: '25 minutes',
//     chefBio: 'Chef Minnie brings 15+ years of authentic Nigerian cooking experience. Every dish tells a story of tradition and love.',
//     liveViewers: 127,
//   },
// }) => {
//   console.log('Meal Data:', mealData); // Debugging line to check mealData
//   const [quantity, setQuantity] = useState(1);
//   const [isExpanded, setIsExpanded] = useState(false);

//   const handleQuantityChange = (value: number) => {
//     setQuantity(value);
//   };

//   const handleSheetChanges = (index: number) => {
//     if (index === -1) {
//       onToggleVisibility();
//     }
//   };

//   // Determine snap points based on expanded state
//   const snapPoints = isExpanded ? ['60%', '90%'] : ['60%'];

//   if (!isVisible) return null;

//   return (
//     <BottomSheetBase
//       snapPoints={snapPoints}
//       index={0}
//       onChange={handleSheetChanges}
//       enablePanDownToClose={true}
//       backgroundStyle={{
//         backgroundColor: 'rgba(250, 255, 250, 0.9)',
//         borderTopLeftRadius: 35,
//         borderTopRightRadius: 35,
//       }}
//       handleIndicatorStyle={{
//         backgroundColor: '#EDEDED',
//         width: 85,
//         height: 5,
//         borderRadius: 20,
//       }}
//     >
//       <View className="flex-1">
//         {/* Drag Handle with Expand Indicator */}
//         <View className="items-center justify-center mb-4">
//           <Pressable
//             className="items-center justify-center"
//             onPress={() => setIsExpanded(!isExpanded)}
//           >
//             <Text className="text-xs text-gray-600 mt-1 font-medium">
//               {/* {isExpanded ? 'Collapse' : 'aExpand'} */}
//             </Text>
//           </Pressable>
//         </View>

//         {/* Title with Sparkles Icon */}
//         <View className="flex-row items-center justify-between mb-4">
//           {/* <Text className="font-inter font-bold text-[30px] leading-9 text-[#094327] flex-1">
//             #{mealData.title}
//           </Text> */}
          
//           {/* Sparkles Icon */}
//           <View className="w-[35px] h-8 justify-center items-center">
//             <AISparkles size={32} color="#094327" />
//           </View>
//         </View>

//         {/* Description */}
//         <Text
//           className="font-sf-pro font-bold text-[17px] leading-[22px] tracking-[-0.43px] text-[#094327] mb-6"
//           numberOfLines={4}
//         >
//           {/* {mealData.description} */}
//         </Text>

//         {/* Action Buttons */}
//         <View className="flex-row gap-2 mb-6">
//           {/* Share Live Button */}
//           {/* <CustomButton
//             text="Share live"
//             backgroundColor="#094327"
//             textColor="#E6FFE8"
//             style={{ flex: 1 }}
//             onPress={onShareLive}
//           /> */}

//           {/* Treat Someone Button */}
//           {/* <CustomButton
//             text="Treat Someone"
//             icon={<ExternalLink color="#094327" size={16} strokeWidth={1.33} />}
//             backgroundColor="rgba(0, 0, 0, 0.3)"
//             textColor="#094327"
//             style={{ flex: 1 }}
//             onPress={onTreatSomeone}
//           /> */}
//         </View>

//         {/* Compact Meal Selection */}
//         <View className="mb-6">
//           {/* <CompactMealSelection
//             title={mealData.title}
//             price={mealData.price}
//             imageSource={mealData.imageSource}
//             onChange={handleQuantityChange}
//           /> */}
//         </View>

//         {/* Expanded Content */}
//         {isExpanded && (
//           <View className="space-y-5">
//             {/* Live Viewers */}
//             {/* <View>
//               <Text className="text-lg font-bold text-[#094327] mb-2">Live Viewers</Text>
//               <View className="flex-row items-center gap-2">
//                 <Text className="text-xl font-bold text-[#094327]">👥 {mealData.liveViewers || 0}</Text>
//                 <Text className="text-base text-gray-600">people watching</Text>
//               </View>
//             </View> */}

//             {/* Cooking Time */}
//             {/* {mealData.cookingTime && (
//               <View>
//                 <Text className="text-lg font-bold text-[#094327] mb-2">Cooking Time</Text>
//                 <Text className="text-base text-gray-600 leading-[22px]">⏱️ {mealData.cookingTime}</Text>
//               </View>
//             )} */}

//             {/* Ingredients */}
//             {/* {mealData.ingredients && mealData.ingredients.length > 0 && (
//               <View>
//                 <Text className="text-lg font-bold text-[#094327] mb-2">Ingredients</Text>
//                 <View className="gap-1">
//                   {mealData.ingredients.map((ingredient, index) => (
//                     <Text key={index} className="text-base text-gray-600 leading-[22px]">
//                       • {ingredient}
//                     </Text>
//                   ))}
//                 </View>
//               </View>
//             )} */}

//             {/* Chef Bio */}
//             {/* {mealData.chefBio && (
//               <View>
//                 <Text className="text-lg font-bold text-[#094327] mb-2">About the Chef</Text>
//                 <Text className="text-base text-gray-600 leading-[22px]">{mealData.chefBio}</Text>
//               </View>
//             )} */}
//           </View>
//         )}
//       </View>
//     </BottomSheetBase>
//   );
// };

// export default OnTheStoveBottomSheet;

// const styles = StyleSheet.create({
//   customButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: 30,
//     height: 35,
//     minWidth: 150,
//     paddingHorizontal: 16,
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     shadowOffset: { width: 0, height: 2 },
//     elevation: 3,
//   },
//   buttonContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//   },
//   buttonText: {
//     fontFamily: 'Lato',
//     fontWeight: '700',
//     fontSize: 15,
//     lineHeight: 22,
//     letterSpacing: 0.03,
//     textAlign: 'center',
//   },
//   buttonIcon: {
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// }); 




import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import BottomSheetBase from './BottomSheetBase'
import AISparkles from './ui/AISparkles';
import CustomLiveButton from './CustomLiveButton';
import { ExternalLink, ForwardIcon, Link } from 'lucide-react-native';
import CompactMealSelection from './CompactMealSelection';
import LoveThisButton from './ui/LoveThisButton';


interface OnTheStoveBottomSheetProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
  onShareLive?: () => void;
  onTreatSomeone?: () => void;
  mealData?: {
    title: string;
    price: string;
    imageSource: any;
    description: string;
    kitchenName: string;
    ingredients?: string[];
    cookingTime?: string;
    chefBio?: string;
    liveViewers?: number;
  };
}
const OnTheStoveBottomSheet: React.FC<OnTheStoveBottomSheetProps> = ({
  isVisible,
  onToggleVisibility,
  onShareLive,
  onTreatSomeone,
  mealData = {
    title: 'Nigerian Jollof',
    price: '£ 16',
    imageSource: 'https://avatar.iran.liara.run/public/44',
    description: 'Watch Chef Minnie craft authentic Nigerian Jollof Rice live! Fresh tomatoes, aromatic spices, and perfectly seasoned rice - order now before it\'s ready.',
    kitchenName: 'Minnies Kitchen',
    ingredients: ['Premium Basmati Rice', 'Fresh Tomatoes', 'Bell Peppers', 'Red Onions', 'Secret Spice Blend'],
    cookingTime: '25 minutes',
    chefBio: 'Chef Minnie brings 15+ years of authentic Nigerian cooking experience. Every dish tells a story of tradition and love.',
    liveViewers: 127,
  },  
}) => {

  // Removed unused quantity state
  const [isExpanded, setIsExpanded] = React.useState(false);

  const snapPoints = isExpanded ? ['60%', '90%'] : ['60%'];


    const handleSheetChanges = (index: number) => {
      if (index === -1) {
        onToggleVisibility();
      }
    };
    const handleQuantityChange = (value: number) => {
      setQuantity(value);
    };

  return (
    <>
    <BottomSheetBase
     snapPoints={snapPoints}
     index={0}
     onChange={handleSheetChanges}
     enablePanDownToClose={true}
     backgroundStyle={{
      backgroundColor: 'rgba(250, 255, 250, 0.9)',
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
    }}
    handleIndicatorStyle={{
      backgroundColor: '#EDEDED',
      width: 85,
      height: 5,
      borderRadius: 20,
    }}
    >
       <View className="flex-1">

       

        {/* Drag Handle with Expand Indicator */}
         <View className="items-center justify-center mb-4">
           <Pressable
             className="items-center justify-center"
             onPress={() => setIsExpanded(!isExpanded)}
             >
             <Text className="text-xs text-gray-600 mt-1 font-medium">
               {isExpanded ? 'Collapse' : 'Expand'}
             </Text>
           </Pressable>
         </View>

         {/* Title with Sparkles Icon */}
        <View className="flex-row items-center justify-between mb-4">
           <Text className="font-inter font-bold text-[30px] leading-9 text-[#094327] flex-1">
             #{mealData.title}
           </Text>
          
           {/* Sparkles Icon */}
           <View className="w-[35px] h-8 justify-center items-center">
             <AISparkles size={32} color="#094327" />
           </View>
         </View>

          {/* Description */}
          <Text
            className="font-sf-pro font-bold text-[17px] leading-[22px] tracking-[-0.43px] text-[#094327] mb-6"
            numberOfLines={4}
            >
           {mealData.description}
          </Text>

         

          {/* Compact Meal Selection */}
         <View className="mb-6">
           <CompactMealSelection
             title={mealData.title}
             price={mealData.price}
             imageSource={mealData.imageSource}
             onChange={handleQuantityChange}
           />
         </View>


          {/* Action Buttons */}
         <View className="flex-row gap-2 mb-6">
           {/* Share Live Button */}
           <CustomLiveButton
            text="Share live"
             backgroundColor="#094327"
             icon={<ForwardIcon/>}  
             textColor="#E6FFE8"
             style={{ flex: 1 }}
             onPress={onShareLive}
             />

           {/* Treat Someone Button */}
           <CustomLiveButton
             text="Treat Someone"
             icon={<Link color="#094327" size={16} strokeWidth={1.33} />}
             backgroundColor="rgba(0, 0, 0, 0.3)"
             textColor="#094327"
             style={{ flex: 1 }}
             
             onPress={onTreatSomeone}
           />
         </View>

      </View>

    </BottomSheetBase>
    
    </>
  )
}

export default OnTheStoveBottomSheet

const styles = StyleSheet.create({
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    height: 35,
    minWidth: 150,
    paddingHorizontal: 16,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontFamily: 'Lato',
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.03,
    textAlign: 'center',
  },
  buttonIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },

}); 

function setQuantity(value: number) {
  throw new Error('Function not implemented.');
}
