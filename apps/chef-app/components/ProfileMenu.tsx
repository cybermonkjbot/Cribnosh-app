import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { User, Settings, CreditCard, TrendingUp, X } from 'lucide-react-native';

interface ProfileMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onEditProfile?: () => void;
  onAccountSettings?: () => void;
  onPayoutSettings?: () => void;
  onViewEarnings?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  onPress?: () => void;
}

export function ProfileMenu({
  isVisible,
  onClose,
  onEditProfile,
  onAccountSettings,
  onPayoutSettings,
  onViewEarnings,
}: ProfileMenuProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%'], []);

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
        pressBehavior="close"
      />
    ),
    []
  );

  const menuItems: MenuItem[] = [
    {
      id: 'edit-profile',
      label: 'Edit Profile',
      icon: User,
      onPress: () => {
        onClose();
        onEditProfile?.();
      },
    },
    {
      id: 'account-settings',
      label: 'Account Settings',
      icon: Settings,
      onPress: () => {
        onClose();
        onAccountSettings?.();
      },
    },
    {
      id: 'payout-settings',
      label: 'Payout Settings',
      icon: CreditCard,
      onPress: () => {
        onClose();
        onPayoutSettings?.();
      },
    },
    {
      id: 'view-earnings',
      label: 'View Earnings',
      icon: TrendingUp,
      onPress: () => {
        onClose();
        onViewEarnings?.();
      },
    },
  ];

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={-1}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
      containerStyle={{
        zIndex: 1000000,
      }}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Menu</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.menuItems}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={item.onPress}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <IconComponent size={20} color="#000" />
                <Text style={styles.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Archivo',
    color: '#094327',
  },
  closeButton: {
    padding: 4,
  },
  menuItems: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
});

