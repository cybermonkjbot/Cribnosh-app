import LiveScreenView from "@/components/ui/LiveViewerScreen";
import { router, useLocalSearchParams } from "expo-router";

const LiveScreen = () => {
  const { sessionId } = useLocalSearchParams();
  return <LiveScreenView sessionId={sessionId as string} onClose={() => router.back()} />;
};

export default LiveScreen;
