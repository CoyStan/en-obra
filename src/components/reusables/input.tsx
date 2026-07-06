import { forwardRef, type ReactNode } from "react";
import { Text, TextInput, type TextInputProps, View } from "react-native";
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

type FieldShellProps = {
  children: ReactNode;
  error?: string;
  helper?: string;
  label: string;
  testID?: string;
};

function FieldShell({ children, error, helper, label, testID }: FieldShellProps) {
  return (
    <View className="gap-ccXs" testID={testID}>
      <Text className="text-ccMicro font-semibold uppercase tracking-wide text-muted-ink">{label}</Text>
      {children}
      {error ? (
        <Text className="text-ccMicro font-semibold text-due">{error}</Text>
      ) : helper ? (
        <Text className="text-ccMicro text-muted-ink">{helper}</Text>
      ) : null}
    </View>
  );
}

type TextFieldProps = TextInputProps & {
  error?: string;
  helper?: string;
  inputClassName?: string;
  label: string;
  testID?: string;
};

export function TextField({
  error,
  helper,
  inputClassName,
  label,
  testID,
  ...props
}: TextFieldProps) {
  return (
    <FieldShell error={error} helper={helper} label={label} testID={testID}>
      <Input
        accessibilityLabel={label}
        className={cn(error && "border-due bg-due-wash", inputClassName)}
        testID={testID ? `${testID}-input` : undefined}
        {...props}
      />
    </FieldShell>
  );
}

type MoneyInputProps = TextInputProps & {
  error?: string;
  helper?: string;
  label: string;
  testID?: string;
};

export function MoneyInput({ error, helper, label, testID, ...props }: MoneyInputProps) {
  return (
    <FieldShell error={error} helper={helper} label={label} testID={testID}>
      <View
        className={cn(
          "min-h-[58px] flex-row items-center rounded-ccLg border border-border bg-canvas px-ccMd",
          error && "border-due bg-due-wash",
        )}
      >
        <Text className="pr-ccSm text-[26px] font-bold text-primary-dark">$</Text>
        <TextInput
          accessibilityLabel={label}
          className="min-w-0 flex-1 text-[30px] font-bold text-ink"
          keyboardType="decimal-pad"
          placeholderTextColor={colors.mutedInk}
          testID={testID ? `${testID}-input` : undefined}
          {...props}
        />
        <Text className="pl-ccSm text-ccMicro font-bold text-muted-ink">MXN</Text>
      </View>
    </FieldShell>
  );
}

type NoteFieldProps = TextFieldProps;

export function NoteField(props: NoteFieldProps) {
  return (
    <TextField
      inputClassName="min-h-[72px] py-ccSm align-top font-normal"
      multiline
      textAlignVertical="top"
      {...props}
    />
  );
}
