import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './MealItemDetails/Skeletons/ShimmerBox';

/**
 * Skeleton loader for ForkPrint Score section
 * Matches the structure of the score section with mascot area
 */
export const ForkPrintScoreSkeleton: React.FC = () => {
  return (
    <View style={styles.scoreSectionContainer}>
      <View style={styles.scoreRow}>
        <View style={styles.scoreContent}>
          {/* Score Label */}
          <SkeletonBox width={80} height={20} borderRadius={4} style={styles.scoreLabelSkeleton} />
          
          {/* ForkPrint Image placeholder */}
          <SkeletonBox width={170} height={40} borderRadius={4} style={styles.forkPrintImageSkeleton} />
          
          {/* Score Value */}
          <SkeletonBox width={120} height={64} borderRadius={8} style={styles.scoreValueSkeleton} />
        </View>
      </View>
      
      {/* Mascot Container Skeleton */}
      <View style={styles.mascotContainer}>
        <SkeletonBox width={200} height={200} borderRadius={100} style={styles.mascotSkeleton} />
        <SkeletonBox width={120} height={16} borderRadius={4} style={styles.mascotStatusSkeleton} />
        <SkeletonBox width={180} height={12} borderRadius={4} style={styles.mascotSubtextSkeleton} />
      </View>
    </View>
  );
};

/**
 * Skeleton loader for Calories and Nosh Points Cards
 * Matches the structure of CaloriesNoshPointsCards component
 */
export const CaloriesNoshPointsSkeleton: React.FC = () => {
  return (
    <View style={styles.caloriesNoshPointsContainer}>
      {/* Calories Card Skeleton */}
      <View style={styles.caloriesCardSkeleton}>
        <SkeletonBox width={100} height={15} borderRadius={4} style={styles.cardTitleSkeleton} />
        <SkeletonBox width={120} height={24} borderRadius={4} style={styles.cardValueSkeleton} />
        <SkeletonBox width={100} height={12} borderRadius={4} style={styles.cardSubtextSkeleton} />
        <SkeletonBox width={280} height={25} borderRadius={10} style={styles.progressBarSkeleton} />
      </View>
      
      {/* Nosh Points Card Skeleton */}
      <View style={styles.noshPointsCardSkeleton}>
        <SkeletonBox width={95} height={15} borderRadius={4} style={styles.cardTitleSkeleton} />
        <SkeletonBox width={80} height={18} borderRadius={4} style={styles.cardAmountSkeleton} />
        <SkeletonBox width={90} height={12} borderRadius={4} style={styles.cardSubtextSkeleton} />
        <SkeletonBox width={280} height={25} borderRadius={10} style={styles.progressBarSkeleton} />
      </View>
    </View>
  );
};

/**
 * Skeleton loader for KPI Cards
 * Matches the structure of KPICards component (meals, calories, streak)
 */
export const KPICardsSkeleton: React.FC = () => {
  return (
    <View style={styles.kpiContainer}>
      {/* Section Header Skeleton */}
      <View style={styles.sectionHeaderSkeleton}>
        <View>
          <SkeletonBox width={160} height={22} borderRadius={4} style={styles.sectionTitleSkeleton} />
          <SkeletonBox width={200} height={15} borderRadius={4} style={styles.sectionSubtitleSkeleton} />
        </View>
        <SkeletonBox width={80} height={32} borderRadius={8} />
      </View>
      
      {/* KPI Cards Row */}
      <View style={styles.kpiCardsRow}>
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.kpiCardSkeleton}>
            <SkeletonBox width={50} height={11} borderRadius={4} style={styles.kpiLabelSkeleton} />
            <SkeletonBox width={60} height={20} borderRadius={4} style={styles.kpiValueSkeleton} />
            <SkeletonBox width={70} height={9} borderRadius={4} style={styles.kpiSubtextSkeleton} />
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * Skeleton loader for Bragging Cards (Weekly Summary)
 * Matches the structure of MealsLoggedCard, CalorieCompareCard, and CuisineScoreCard
 */
export const BraggingCardsSkeleton: React.FC = () => {
  return (
    <View style={styles.braggingCardsContainer}>
      {/* Sheet Header Skeleton */}
      <View style={styles.sheetHeaderSkeleton}>
        <SkeletonBox width={140} height={20} borderRadius={4} />
        <SkeletonBox width={80} height={14} borderRadius={4} />
      </View>
      
      {/* Meals Logged Card Skeleton */}
      <View style={styles.braggingCardSkeleton}>
        <View style={styles.cardHeaderSkeleton}>
          <View style={styles.cardTitleRowSkeleton}>
            <SkeletonBox width={20} height={20} borderRadius={4} />
            <SkeletonBox width={100} height={16} borderRadius={4} />
          </View>
          <SkeletonBox width={16} height={16} borderRadius={4} />
        </View>
        <SkeletonBox width="100%" height={16} borderRadius={4} style={styles.cardSummarySkeleton} />
        <SkeletonBox width="100%" height={1} borderRadius={1} style={styles.cardSeparatorSkeleton} />
        <View style={styles.cardDataSectionSkeleton}>
          <View>
            <SkeletonBox width={100} height={14} borderRadius={4} />
            <SkeletonBox width={60} height={28} borderRadius={4} style={styles.cardDataValueSkeleton} />
            <SkeletonBox width={50} height={14} borderRadius={4} />
          </View>
          <SkeletonBox width={200} height={80} borderRadius={8} />
        </View>
      </View>
      
      {/* Calorie Compare Card Skeleton */}
      <View style={styles.braggingCardSkeleton}>
        <View style={styles.cardHeaderSkeleton}>
          <View style={styles.cardTitleRowSkeleton}>
            <SkeletonBox width={20} height={20} borderRadius={4} />
            <SkeletonBox width={120} height={16} borderRadius={4} />
          </View>
          <SkeletonBox width={16} height={16} borderRadius={4} />
        </View>
        <SkeletonBox width="100%" height={16} borderRadius={4} style={styles.cardSummarySkeleton} />
        <SkeletonBox width="100%" height={1} borderRadius={1} style={styles.cardSeparatorSkeleton} />
        <View style={styles.cardDataSectionSkeleton}>
          <View style={styles.calorieDataItemSkeleton}>
            <SkeletonBox width={80} height={28} borderRadius={4} />
            <SkeletonBox width={40} height={14} borderRadius={4} />
            <SkeletonBox width={60} height={4} borderRadius={2} />
            <SkeletonBox width={60} height={14} borderRadius={4} />
          </View>
          <View style={styles.calorieDataItemSkeleton}>
            <SkeletonBox width={80} height={28} borderRadius={4} />
            <SkeletonBox width={40} height={14} borderRadius={4} />
            <SkeletonBox width={60} height={4} borderRadius={2} />
            <SkeletonBox width={60} height={14} borderRadius={4} />
          </View>
        </View>
      </View>
      
      {/* Cuisine Score Card Skeleton */}
      <View style={styles.braggingCardSkeleton}>
        <View style={styles.cardHeaderSkeleton}>
          <View style={styles.cardTitleRowSkeleton}>
            <SkeletonBox width={20} height={20} borderRadius={4} />
            <SkeletonBox width={100} height={16} borderRadius={4} />
          </View>
          <SkeletonBox width={16} height={16} borderRadius={4} />
        </View>
        <SkeletonBox width="100%" height={16} borderRadius={4} style={styles.cardSummarySkeleton} />
        <SkeletonBox width="100%" height={1} borderRadius={1} style={styles.cardSeparatorSkeleton} />
        <View style={styles.cardDataSectionSkeleton}>
          <View>
            <SkeletonBox width={60} height={28} borderRadius={4} />
            <SkeletonBox width={100} height={14} borderRadius={4} />
          </View>
          <View style={styles.cuisineTagsSkeleton}>
            {[1, 2, 3].map((index) => (
              <SkeletonBox key={index} width={80} height={28} borderRadius={16} />
            ))}
            <SkeletonBox width={40} height={28} borderRadius={16} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ForkPrint Score Skeleton Styles
  scoreSectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 30,
    marginTop: 20,
    position: 'relative',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  scoreContent: {
    flex: 1,
    position: 'relative',
  },
  scoreLabelSkeleton: {
    marginBottom: 5,
    marginLeft: 80,
  },
  forkPrintImageSkeleton: {
    marginTop: -5,
    marginLeft: 80,
  },
  scoreValueSkeleton: {
    marginTop: 10,
    marginLeft: 80,
  },
  mascotContainer: {
    position: 'absolute',
    top: -50,
    right: -50,
    alignItems: 'center',
    zIndex: 1,
  },
  mascotSkeleton: {
    marginBottom: 10,
  },
  mascotStatusSkeleton: {
    position: 'absolute',
    bottom: 40,
    zIndex: 2,
  },
  mascotSubtextSkeleton: {
    position: 'absolute',
    bottom: 20,
    zIndex: 2,
  },
  
  // Calories/Nosh Points Skeleton Styles
  caloriesNoshPointsContainer: {
    width: 342,
    height: 170,
    position: 'relative',
  },
  caloriesCardSkeleton: {
    position: 'absolute',
    width: 333,
    height: 112,
    left: 7,
    top: 0,
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  noshPointsCardSkeleton: {
    position: 'absolute',
    width: 342,
    height: 110,
    left: 0,
    top: 40,
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitleSkeleton: {
    position: 'absolute',
    left: 18,
    top: 5,
  },
  cardValueSkeleton: {
    position: 'absolute',
    left: 18,
    top: 30,
  },
  cardAmountSkeleton: {
    position: 'absolute',
    right: 20,
    top: 5,
  },
  cardSubtextSkeleton: {
    position: 'absolute',
    left: 18,
    top: 60,
  },
  progressBarSkeleton: {
    position: 'absolute',
    left: 18,
    top: 76,
  },
  
  // KPI Cards Skeleton Styles
  kpiContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingTop: 16,
  },
  sectionHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitleSkeleton: {
    marginBottom: 6,
  },
  sectionSubtitleSkeleton: {
    marginTop: 6,
  },
  kpiCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  kpiCardSkeleton: {
    width: 108,
    height: 72,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  kpiLabelSkeleton: {
    marginBottom: 4,
  },
  kpiValueSkeleton: {
    marginBottom: 4,
  },
  kpiSubtextSkeleton: {
    marginTop: 4,
  },
  
  // Bragging Cards Skeleton Styles
  braggingCardsContainer: {
    marginHorizontal: 0,
    marginBottom: 40,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    minHeight: 200,
  },
  sheetHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  braggingCardSkeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    marginVertical: 8,
    marginBottom: 16,
  },
  cardHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardSummarySkeleton: {
    marginBottom: 12,
  },
  cardSeparatorSkeleton: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardDataSectionSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardDataValueSkeleton: {
    marginTop: 4,
    marginBottom: 4,
  },
  calorieDataItemSkeleton: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  cuisineTagsSkeleton: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
});

