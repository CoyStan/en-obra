import "./global.css";
import { StatusBar } from "expo-status-bar";
import { CoreReusablesProof } from "./src/components/nativewind/CoreReusablesProof";
import { NativeWindProof } from "./src/components/nativewind/NativeWindProof";
import { ReusablesProof } from "./src/components/nativewind/ReusablesProof";
import { SurfaceRowsProof } from "./src/components/nativewind/SurfaceRowsProof";
import { MainScreen } from "./src/screens/MainScreen";

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <NativeWindProof />
      <ReusablesProof />
      <CoreReusablesProof />
      <SurfaceRowsProof />
      <MainScreen />
    </>
  );
}
