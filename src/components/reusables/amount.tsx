import { Text } from "react-native";
import { formatMoney } from "../../domain/money";
import { cn } from "./utils";

type AmountTone = "neutral" | "success" | "due";

type AmountProps = {
  cents: number;
  className?: string;
  emphasis?: boolean;
  testID?: string;
  tone?: AmountTone;
};

export function Amount({
  cents,
  className,
  emphasis = false,
  testID,
  tone = "neutral",
}: AmountProps) {
  return (
    <Text
      className={cn(
        "text-ccSmall font-bold text-ink",
        emphasis && "text-[21px]",
        tone === "success" && "text-primary",
        tone === "due" && "text-due",
        className,
      )}
      testID={testID}
    >
      {formatMoney(cents)}
    </Text>
  );
}
