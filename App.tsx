import "./global.css";
import { StatusBar } from "expo-status-bar";
import { NativeWindProof } from "./src/components/nativewind/NativeWindProof";
import { MainScreen } from "./src/screens/MainScreen";

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <NativeWindProof />
      <MainScreen />
    </>
  );
}
