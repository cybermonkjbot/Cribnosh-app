import React from 'react';
import { EmptyState } from './EmptyState';

interface KitchensNearMeEmptyProps {
  onBrowseAll?: () => void;
  onEnableLocation?: () => void;
}

export const KitchensNearMeEmpty: React.FC<KitchensNearMeEmptyProps> = ({
  onBrowseAll,
  onEnableLocation,
}) => {
  return (
    <EmptyState
      title="No Kitchens Nearby"
      subtitle="We couldn't find any kitchens near your location. Try enabling location services or browse all kitchens."
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
              label: 'Browse All Kitchens',
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

