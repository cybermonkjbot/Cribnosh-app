import React from 'react';
import { EmptyState } from './EmptyState';

interface OrderAgainSectionEmptyProps {
  onBrowseAll?: () => void;
}

export const OrderAgainSectionEmpty: React.FC<OrderAgainSectionEmptyProps> = ({
  onBrowseAll,
}) => {
  return (
    <EmptyState
      title="No Previous Orders"
      subtitle="You haven't placed any orders yet. Start exploring and order something delicious!"
      icon="receipt-outline"
      actionButton={
        onBrowseAll
          ? {
              label: 'Browse Kitchens',
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

