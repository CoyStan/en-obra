import "./global.css";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TrackerScreen } from "./src/screens/TrackerScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <TrackerScreen />
    </SafeAreaProvider>
  );
}
