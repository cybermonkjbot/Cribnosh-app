import React from 'react';
import { EmptyState } from './EmptyState';

interface FoodCreatorsNearMeEmptyProps {
  onBrowseAll?: () => void;
  onEnableLocation?: () => void;
}

export const FoodCreatorsNearMeEmpty: React.FC<FoodCreatorsNearMeEmptyProps> = ({
  onBrowseAll,
  onEnableLocation,
}) => {
  return (
    <EmptyState
      title="No FoodCreators Nearby"
      subtitle="We couldn't find any foodCreators near your location. Try enabling location services or browse all foodCreators."
      icon="location-outline"
      actionButton={
        onEnableLocation
          ? {
              label: 'Enable Location',
              onPress: onEnableLocation,
            }
          : undefined
      }
      secondaryActionButton={
        onBrowseAll
          ? {
              label: 'Browse All FoodCreators',
              onPress: onBrowseAll,
            }
          : undefined
      }
      style={{
        paddingVertical: 40,
        paddingHorizontal: 20,
      }}
    />
  );
};

