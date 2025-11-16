import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Dimensions,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface FilterOption {
  id: string;
  label: string;
  color: string;
  icon?: React.ReactNode;
}

interface FilterDropdownProps {
  options: FilterOption[];
  selectedId: string;
  onSelect: (filterId: string) => void;
  triggerButton: React.ReactNode;
  position?: "left" | "right" | "center";
  maxHeight?: number;
  enableHaptics?: boolean;
}

export function FilterDropdown({
  options,
  selectedId,
  onSelect,
  triggerButton,
  position = "right",
  maxHeight = 400,
  enableHaptics = true,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 200 });
  const [isPositioned, setIsPositioned] = useState(false);
  const triggerRef = useRef<View>(null);
  const positioningRef = useRef(false);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  const triggerHaptic = useCallback(() => {
    if (enableHaptics) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}
    }
  }, [enableHaptics]);

  const measureTrigger = useCallback(() => {
    positioningRef.current = false;
    if (triggerRef.current) {
      // Use requestAnimationFrame to ensure the view is laid out
      requestAnimationFrame(() => {
        if (triggerRef.current) {
          triggerRef.current.measureInWindow((x, y, width, height) => {
            let left = x;
            const top = y + height + 8; // 8px gap below button

            // Adjust position based on preference
            if (position === "right") {
              left = x + width - 200; // Align dropdown to right edge of button
            } else if (position === "center") {
              left = x + (width - 200) / 2; // Center dropdown relative to button
            }
            // "left" keeps the original x position

            const fixedHeight = 230; // Fixed dropdown height
            const screenHeight = Dimensions.get("window").height;
            
            setDropdownPosition({
              top: Math.min(top, screenHeight - fixedHeight - 20),
              left: Math.max(8, Math.min(left, SCREEN_WIDTH - 208)), // Ensure it fits on screen
              width: 200,
            });
            positioningRef.current = true;
            setIsPositioned(true);
          });
        }
      });
    } else {
      // Fallback position if ref is not available
      const screenHeight = Dimensions.get("window").height;
      setDropdownPosition({
        top: screenHeight / 2 - 115, // Center vertically
        left: position === "right" ? SCREEN_WIDTH - 208 : 8,
        width: 200,
      });
      positioningRef.current = true;
      setIsPositioned(true);
    }
  }, [position]);

  const handleToggle = useCallback(() => {
    if (!isOpen) {
      setIsPositioned(false);
      measureTrigger();
      // Small delay to ensure measurement completes, with fallback
      setTimeout(() => {
        // If still not positioned, use fallback
        if (!positioningRef.current) {
          const screenHeight = Dimensions.get("window").height;
          setDropdownPosition({
            top: screenHeight / 2 - 115,
            left: position === "right" ? SCREEN_WIDTH - 208 : 8,
            width: 200,
          });
          setIsPositioned(true);
        }
        triggerHaptic();
        setIsOpen(true);
      }, 100);
    } else {
      triggerHaptic();
      setIsOpen(false);
      setIsPositioned(false);
    }
  }, [isOpen, measureTrigger, triggerHaptic, position]);

  const handleSelect = useCallback(
    (filterId: string) => {
      triggerHaptic();
      onSelect(filterId);
      setIsOpen(false);
      setIsPositioned(false);
    },
    [onSelect, triggerHaptic]
  );

  useEffect(() => {
    if (isOpen) {
      opacity.value = withSpring(1);
      scale.value = withSpring(1);
    } else {
      opacity.value = withSpring(0);
      scale.value = withSpring(0.95);
    }
  }, [isOpen, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <TouchableOpacity onPress={handleToggle} activeOpacity={0.8}>
          {triggerButton}
        </TouchableOpacity>
      </View>

      <Modal
        visible={isOpen && isPositioned}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <Animated.View
            style={[
              {
                position: "absolute",
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                height: 230, // Fixed height of 230px, content will scroll if needed
                zIndex: 10000,
              },
              animatedStyle,
            ]}
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
          >
            <View
              onStartShouldSetResponder={() => true}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 20,
                overflow: "hidden",
                flex: 1,
              }}
            >
              <BlurView
                intensity={80}
                tint="light"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 16,
                }}
              />
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  padding: 8,
                }}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {options.map((option) => {
                  const isSelected = selectedId === option.id;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => handleSelect(option.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: isSelected
                          ? `${option.color}15`
                          : "transparent",
                        marginBottom: 4,
                      }}
                      activeOpacity={0.7}
                    >
                      {option.icon && (
                        <View style={{ marginRight: 10 }}>{option.icon}</View>
                      )}
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: isSelected ? "600" : "500",
                          color: isSelected ? option.color : "#1a1a1a",
                        }}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: option.color,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                            <Path
                              d="M20 6L9 17l-5-5"
                              stroke="#ffffff"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

