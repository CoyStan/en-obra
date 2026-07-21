import "./global.css";
import { StatusBar } from "expo-status-bar";
import { TrackerScreen } from "./src/screens/TrackerScreen";

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <TrackerScreen />
    </>
  );
}
