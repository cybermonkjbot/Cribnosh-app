import LiveScreenView from "@/components/ui/LiveViewerScreen";
import { router } from "expo-router";

const LiveScreen = () => {
  return <LiveScreenView onClose={() => router.back()} />;
};

export default LiveScreen;
