import LiveScreenView from "@/components/ui/LiveViewerScreen";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LiveScreen = () => {
  const { sessionId } = useLocalSearchParams();
  const featureFlags = useQuery(api.featureFlags.get, { group: 'mobile_home' });

  const isFeatureEnabled = (key: string) => {
    if (!featureFlags) return true; // Default to true while loading
    const flag = featureFlags.find((f: any) => f.key === key);
    return flag ? flag.value : true;
  };

  const isLiveEnabled = isFeatureEnabled('mobile_live_sessions');

  if (!isLiveEnabled) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Live Sessions Unavailable</Text>
          <Text style={styles.message}>
            Live cooking sessions are currently disabled. Please check back later.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return <LiveScreenView sessionId={sessionId as string} onClose={() => router.back()} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LiveScreen;
