import { Text } from "react-native";
import { Button, Card, Input } from "../reusables";

export function ReusablesProof() {
  return (
    <Card className="hidden h-0 w-0" testID="reusables-proof-card">
      <Text className="text-ccMicro font-bold text-primary-dark">Reusables ready</Text>
      <Input accessibilityLabel="Reusables proof input" value="MXN" editable={false} />
      <Button testID="reusables-proof-button">Proof</Button>
    </Card>
  );
}
