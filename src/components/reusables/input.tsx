import { forwardRef } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { colors } from "../../theme/theme";
import { cn } from "./utils";

type InputProps = TextInputProps & {
  className?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { className, placeholderTextColor = colors.mutedInk, ...props },
  ref,
) {
  return (
    <TextInput
      className={cn(
        "min-h-[44px] rounded-lg border border-input bg-background px-3 text-base text-foreground",
        className,
      )}
      placeholderTextColor={placeholderTextColor}
      ref={ref}
      {...props}
    />
  );
});
