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
        "min-h-[48px] rounded-ccMd border border-border bg-canvas px-ccMd text-ccBody font-semibold text-ink",
        className,
      )}
      placeholderTextColor={placeholderTextColor}
      ref={ref}
      {...props}
    />
  );
});
