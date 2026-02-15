import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { useQuery } from 'convex/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BottomSheetBase } from '../BottomSheetBase';
import { Mascot } from '../Mascot';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

type TabType = 'nosh_pass' | 'discount';

interface NoshPassModalProps {
  isVisible: boolean;
  onClose: () => void;
  onApplyCode?: (code: string, type: TabType, couponId?: string, pointsAmount?: number) => void;
  appliedCode?: string | null;
  appliedCodeType?: TabType | null;
  appliedPoints?: number | null;
  cartSubtotal?: number;
}

// Points to currency conversion: 1 point = £0.01
const POINTS_TO_POUNDS_RATE = 0.01;

export function NoshPassModal({
  isVisible,
  onClose,
  onApplyCode,
  appliedCode,
  appliedCodeType,
  appliedPoints,
  cartSubtotal = 0,
}: NoshPassModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('nosh_pass');
  const [code, setCode] = useState('');
  const [pointsToApply, setPointsToApply] = useState<number>(0);
  const [isApplying, setIsApplying] = useState(false);
  const { showToast } = useToast();

  // Get session token for queries
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  useEffect(() => {
    const loadToken = async () => {
      const token = await getSessionToken();
      setSessionToken(token);
    };
    if (isVisible) {
      loadToken();
    }
  }, [isVisible]);

  // Get user for points query
  const user = useQuery(
    api.queries.users.getUserBySessionToken,
    sessionToken ? { sessionToken } : 'skip'
  );

  // Get user's Nosh Points balance
  const pointsData = useQuery(
    api.queries.noshPoints.getPointsByUserId,
    user?._id ? { userId: user._id } : 'skip'
  );

  const availablePoints = pointsData?.available_points || 0;
  const maxPointsToApply = Math.min(availablePoints, Math.floor(cartSubtotal / POINTS_TO_POUNDS_RATE));

  // Random messages the mascot can say
  const mascotMessages = [
    'Hola',
    'Hello',
    'Hey!',
    'Hi there!',
    'Bonjour',
    'Ciao',
    'Yo!',
    'Howdy!',
    'Greetings!',
    'Welcome!',
  ];

  // Randomly choose a message
  const [mascotMessage] = useState(() => {
    const randomIndex = Math.floor(Math.random() * mascotMessages.length);
    return mascotMessages[randomIndex];
  });

  // Determine bubble position based on text length
  const bubblePosition = mascotMessage.length <= 5 ? 'right' : 'left';

  const handleApply = async (pointsOverride?: number) => {
    if (activeTab === 'nosh_pass') {
      // Apply Nosh Points
      const pointsToUse = pointsOverride ?? pointsToApply;

      if (pointsToUse <= 0) {
        showToast({
          type: 'error',
          title: 'Invalid Amount',
          message: 'Please select points to apply',
          duration: 2000,
        });
        return;
      }

      if (pointsToUse > availablePoints) {
        showToast({
          type: 'error',
          title: 'Insufficient Points',
          message: `You only have ${availablePoints.toLocaleString()} points available`,
          duration: 2000,
        });
        return;
      }

      setIsApplying(true);
      try {
        const discountAmount = pointsToUse * POINTS_TO_POUNDS_RATE;

        if (onApplyCode) {
          await onApplyCode(
            `NOSH_POINTS_${pointsToUse}`,
            'nosh_pass',
            undefined,
            pointsToUse
          );
        }

        showToast({
          type: 'success',
          title: 'Points Applied',
          message: `${pointsToUse.toLocaleString()} points (£${discountAmount.toFixed(2)}) applied successfully`,
          duration: 2000,
        });
        setPointsToApply(0);
        onClose();
      } catch (error: any) {
        showToast({
          type: 'error',
          title: 'Error',
          message: error?.message || 'Failed to apply points',
          duration: 3000,
        });
      } finally {
        setIsApplying(false);
      }
    } else {
      // Apply Discount Code
      if (!code.trim()) {
        showToast({
          type: 'error',
          title: 'Invalid Code',
          message: 'Please enter a discount code',
          duration: 2000,
        });
        return;
      }

      setIsApplying(true);
      try {
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          throw new Error('Authentication required');
        }

        const convex = getConvexClient();

        // Validate coupon via backend
        const result = await convex.action(api.actions.coupons.validateAndApplyCoupon, {
          code: code.trim().toUpperCase(),
          sessionToken,
        });

        if (!result.success || !result.coupon) {
          throw new Error(result.error || 'Invalid code');
        }

        // Call the callback with code, type, and coupon ID
        if (onApplyCode) {
          await onApplyCode(
            code.trim().toUpperCase(),
            result.coupon.type as TabType,
            result.coupon._id
          );
        }

        showToast({
          type: 'success',
          title: 'Code Applied',
          message: `Discount code "${code.trim().toUpperCase()}" applied successfully`,
          duration: 2000,
        });
        onClose();
      } catch (error: any) {
        showToast({
          type: 'error',
          title: 'Invalid Code',
          message: '',
          duration: 3000,
        });
      } finally {
        setIsApplying(false);
      }
    }
  };

  const handleRemove = () => {
    if (onApplyCode) {
      onApplyCode('', activeTab, undefined, activeTab === 'nosh_pass' ? 0 : undefined);
    }
    setCode('');
    setPointsToApply(0);
    onClose();
  };

  // Reset when modal closes or tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCode('');
    setPointsToApply(0);
  };



  const snapPoints = useMemo(() => ['60%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <BottomSheetBase
      snapPoints={snapPoints}
      index={0}
      onChange={handleSheetChanges}
      enablePanDownToClose={!isApplying}
      backgroundStyle={{
        backgroundColor: '#FAFFFA',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Enter Code</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={isApplying}>
            <SvgXml xml={closeIconSVG} width={24} height={24} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'nosh_pass' && styles.tabActive]}
            onPress={() => handleTabChange('nosh_pass')}
          >
            <Text style={[styles.tabText, activeTab === 'nosh_pass' && styles.tabTextActive]}>
              Nosh Pass
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'discount' && styles.tabActive]}
            onPress={() => handleTabChange('discount')}
          >
            <Text style={[styles.tabText, activeTab === 'discount' && styles.tabTextActive]}>
              Discount Code
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'nosh_pass' ? (
            <>
              {appliedPoints && appliedPoints > 0 && appliedCodeType === 'nosh_pass' ? (
                <View style={styles.appliedContainer}>
                  <View style={styles.appliedBadge}>
                    <Text style={styles.appliedText}>
                      {appliedPoints.toLocaleString()} points applied
                    </Text>
                    <TouchableOpacity onPress={handleRemove} style={styles.removeButton}>
                      <SvgXml xml={closeIconSVG} width={16} height={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  {/* Points Display with Mascot */}
                  <View style={styles.pointsDisplayRow}>
                    <View style={styles.pointsNumberContainer}>
                      <Text style={styles.pointsNumber}>
                        {availablePoints.toLocaleString()}
                      </Text>
                      <Text style={styles.pointsSubscript}>
                        £{(availablePoints * POINTS_TO_POUNDS_RATE).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.mascotContainer}>
                      <View style={[
                        styles.speechBubble,
                        bubblePosition === 'left' ? styles.speechBubbleLeft : styles.speechBubbleRight
                      ]}>
                        <Text style={styles.speechBubbleText}>{mascotMessage}</Text>
                      </View>
                      <View style={styles.mascotZoom}>
                        <Mascot emotion="happy" size={120} />
                      </View>
                    </View>
                  </View>

                  {/* Note */}
                  <Text style={styles.noteText}>
                    Clicking apply would use all your Nosh Points to discount this order
                  </Text>

                  {/* Apply Button */}
                  <Pressable
                    style={[
                      styles.applyButton,
                      (isApplying || availablePoints === 0 || maxPointsToApply === 0) && styles.applyButtonDisabled
                    ]}
                    onPress={async () => {
                      // Auto-apply max points
                      if (maxPointsToApply > 0) {
                        await handleApply(maxPointsToApply);
                      }
                    }}
                    disabled={isApplying || availablePoints === 0 || maxPointsToApply === 0}
                  >
                    <Text style={styles.applyButtonText}>
                      {isApplying ? 'Applying...' : 'Apply'}
                    </Text>
                  </Pressable>
                </>
              )}
            </>
          ) : (
            <>
              <Text style={styles.description}>
                Enter your discount code to apply a discount to your order
              </Text>

              {appliedCode && appliedCodeType === 'discount' ? (
                <View style={styles.appliedCodeContainer}>
                  <View style={styles.appliedCodeBadge}>
                    <Text style={styles.appliedCodeText}>{appliedCode}</Text>
                    <TouchableOpacity onPress={handleRemove} style={styles.removeButton}>
                      <SvgXml xml={closeIconSVG} width={16} height={16} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.appliedCodeLabel}>Code Applied</Text>
                </View>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter discount code"
                      placeholderTextColor="#9CA3AF"
                      value={code}
                      onChangeText={setCode}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!isApplying}
                    />
                  </View>
                  <Pressable
                    style={[styles.applyButton, isApplying && styles.applyButtonDisabled]}
                    onPress={() => handleApply()}
                    disabled={isApplying}
                  >
                    <Text style={styles.applyButtonText}>
                      {isApplying ? 'Applying...' : 'Apply Code'}
                    </Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </View>
      </View>
    </BottomSheetBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  applyButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  appliedCodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appliedCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#094327',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  appliedCodeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#094327',
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  appliedCodeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#094327',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#094327',
    fontWeight: '700',
  },
  pointsDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pointsNumberContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  pointsNumber: {
    fontSize: 64,
    fontWeight: '700',
    color: '#094327',
    fontFamily: 'Inter',
    lineHeight: 72,
  },
  pointsSubscript: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: -4,
  },
  noteText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    overflow: 'visible',
    position: 'relative',
  },
  mascotZoom: {
    transform: [{ scale: 2.0 }],
  },
  speechBubble: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  speechBubbleRight: {
    right: -20,
  },
  speechBubbleLeft: {
    left: -20,
  },
  speechBubbleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#094327',
    fontFamily: 'Inter',
  },
  appliedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#094327',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  appliedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#094327',
    marginRight: 12,
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
});

