import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface Modal {
  isOpen: boolean;
  onClick: () => void;
}

export default function LinkModal({ isOpen, onClick }: Modal) {
  return (
    <View
      style={[
        styles.container,
        isOpen ? styles.visible : styles.hidden,
      ]}
    >
      <View style={styles.overlay} />

      <View style={styles.contentWrapper}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            Payment Link Created
          </Text>
          <Text style={styles.description}>
            The link will be active for 1 hour. When expired the order would be
            automatically canvelled
          </Text>
          <View style={styles.buttons}>
            <Pressable
              onPress={onClick}
              style={styles.button}
            >
              <Text style={styles.buttonTextCancel}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onClick}
              style={styles.button}
            >
              <Text style={styles.buttonTextConfirm}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // flex-1
    zIndex: 40, // z-40
    position: 'absolute', // absolute
    width: '100%', // w-screen
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    height: '100%', // h-full
  },
  visible: {
    display: 'flex', // flex
  },
  hidden: {
    display: 'none', // hidden
  },
  overlay: {
    flex: 1, // flex-1
    zIndex: 40, // z-40
    position: 'absolute', // absolute
    width: '100%', // w-screen
    display: 'flex', // flex
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    height: '100%', // h-full
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // bg-black/50
  },
  contentWrapper: {
    height: '100%', // h-full
    width: '100%', // w-full
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    paddingHorizontal: 24, // px-6
  },
  modal: {
    height: 'auto', // h-auto
    backgroundColor: 'rgba(250, 255, 250, 0.8)', // bg-[#FAFFFA]/80
    width: '100%', // w-full
    zIndex: 50, // z-50
    padding: 20, // p-5
    gap: 12, // gap-y-3
    alignItems: 'center', // items-center
    borderRadius: 12, // rounded-xl
  },
  title: {
    color: '#171A1F', // font-[#171A1F]
    fontSize: 24, // text-2xl
    marginTop: 20, // mt-5
  },
  description: {
    color: '#171A1F', // font-[#171A1F]
    fontSize: 18, // text-lg
    paddingHorizontal: 16, // px-4
    textAlign: 'center', // text-center
  },
  buttons: {
    flexDirection: 'row', // flex flex-row
    gap: 16, // gap-x-4
    width: '100%',
  },
  button: {
    backgroundColor: '#FFFFFF', // bg-white
    padding: 16, // p-4
    borderRadius: 12, // rounded-xl
    flex: 1, // flex-1
    alignItems: 'center', // items-center
  },
  buttonTextCancel: {
    color: '#565D6D', // text-[#565D6D]
  },
  buttonTextConfirm: {
    color: '#094327', // text-[#094327]
  },
});
