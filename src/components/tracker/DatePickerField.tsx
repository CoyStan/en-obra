import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Button, Field } from "../reusables";
import { formatTrackerDate } from "../../tracker/presentation";
import { fromIsoDate, toIsoDate } from "../../tracker/dates";
import { trackerColors as color } from "../../tracker/theme";

type DatePickerFieldProps = {
  accessibilityLabel?: string;
  clearable?: boolean;
  label: string;
  maximumDate?: string;
  onChange: (value?: string) => void;
  optional?: boolean;
  value?: string;
};

const weekdayLabels = ["L", "M", "M", "J", "V", "S", "D"];

function monthLabel(value: Date) {
  return new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(value);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function changeMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function calendarDays(month: Date) {
  const firstWeekday = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day >= 1 && day <= daysInMonth ? new Date(month.getFullYear(), month.getMonth(), day) : undefined;
  });
}

export function DatePickerField({
  accessibilityLabel,
  clearable = false,
  label,
  maximumDate,
  onChange,
  optional = false,
  value,
}: DatePickerFieldProps) {
  const selectedDate = fromIsoDate(value);
  const maximum = fromIsoDate(maximumDate);
  const [nativePickerOpen, setNativePickerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(selectedDate ?? new Date()));
  const days = useMemo(() => calendarDays(calendarMonth), [calendarMonth]);

  useEffect(() => {
    if (calendarOpen) {
      setCalendarMonth(startOfMonth(selectedDate ?? new Date()));
    }
  }, [calendarOpen, selectedDate?.getFullYear(), selectedDate?.getMonth(), selectedDate?.getDate()]);

  const openPicker = () => {
    if (Platform.OS === "web") {
      setCalendarOpen((open) => !open);
      return;
    }
    setNativePickerOpen(true);
  };

  const selectDate = (date: Date) => {
    onChange(toIsoDate(date));
    setCalendarOpen(false);
  };

  return (
    <Field className="mb-0" description={optional ? "Opcional" : undefined} label={label}>
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityHint="Abre el selector de fecha"
          accessibilityLabel={accessibilityLabel ?? `${label}. ${value ? formatTrackerDate(value) : "Sin fecha"}`}
          accessibilityRole="button"
          className="min-h-[44px] flex-1 flex-row items-center rounded-lg border border-input bg-background px-3"
          onPress={openPicker}
          style={({ pressed }) => [pressed && { opacity: 0.68 }]}
        >
          <MaterialCommunityIcons color={value ? color.forest : color.inkMuted} name="calendar-month-outline" size={19} />
          <Text className={`ml-2 flex-1 text-sm font-bold ${value ? "text-foreground" : "font-medium text-muted-foreground"}`}>
            {value ? formatTrackerDate(value) : "Elegir fecha"}
          </Text>
          <MaterialCommunityIcons color={color.inkMuted} name={calendarOpen ? "chevron-up" : "chevron-down"} size={19} />
        </Pressable>
        {clearable && value ? (
          <Button
            accessibilityLabel={`Quitar ${label.toLowerCase()}`}
            className="h-11 w-11"
            icon="close"
            onPress={() => onChange(undefined)}
            size="icon"
            variant="secondary"
          />
        ) : null}
      </View>
      {Platform.OS !== "web" && nativePickerOpen ? (
        <DateTimePicker
          display={Platform.OS === "ios" ? "compact" : "default"}
          maximumDate={maximum}
          mode="date"
          onChange={(_event, date) => {
            if (Platform.OS !== "ios") {
              setNativePickerOpen(false);
            }
            if (date) {
              onChange(toIsoDate(date));
            }
          }}
          value={selectedDate ?? new Date()}
        />
      ) : null}
      {Platform.OS === "web" && calendarOpen ? (
        <View accessibilityLabel={`${label}: calendario`} className="mt-2 rounded-lg border border-border bg-card p-3">
          <View className="mb-2 flex-row items-center justify-between">
            <Pressable
              accessibilityLabel="Mes anterior"
              accessibilityRole="button"
              className="h-9 w-9 items-center justify-center rounded-md"
              onPress={() => setCalendarMonth((month) => changeMonth(month, -1))}
              style={({ pressed }) => [pressed && { opacity: 0.68 }]}
            >
              <MaterialCommunityIcons color={color.ink} name="chevron-left" size={20} />
            </Pressable>
            <Text className="text-[13px] font-bold capitalize text-foreground">{monthLabel(calendarMonth)}</Text>
            <Pressable
              accessibilityLabel="Mes siguiente"
              accessibilityRole="button"
              className="h-9 w-9 items-center justify-center rounded-md"
              onPress={() => setCalendarMonth((month) => changeMonth(month, 1))}
              style={({ pressed }) => [pressed && { opacity: 0.68 }]}
            >
              <MaterialCommunityIcons color={color.ink} name="chevron-right" size={20} />
            </Pressable>
          </View>
          <View className="flex-row flex-wrap items-center">
            {weekdayLabels.map((day, index) => (
              <Text className="w-[14.2857%] pb-1 text-center text-[11px] font-bold text-muted-foreground" key={`${day}-${index}`}>
                {day}
              </Text>
            ))}
            {days.map((date, index) => {
              if (!date) {
                return <View className="h-[38px] w-[14.2857%]" key={`blank-${index}`} />;
              }
              const iso = toIsoDate(date);
              const selected = iso === value;
              const today = iso === toIsoDate(new Date());
              const disabled = Boolean(maximumDate && iso > maximumDate);
              return (
                <Pressable
                  accessibilityLabel={new Intl.DateTimeFormat("es-MX", { dateStyle: "full" }).format(date)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled, selected }}
                  className="h-[38px] w-[14.2857%] items-center justify-center rounded-full"
                  disabled={disabled}
                  key={iso}
                  onPress={() => selectDate(date)}
                  style={({ pressed }) => [
                    today && !selected ? { backgroundColor: color.forestWash } : undefined,
                    selected ? { backgroundColor: color.forest } : undefined,
                    disabled ? { backgroundColor: color.surfaceMuted } : undefined,
                    pressed && { opacity: 0.68 },
                  ]}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{
                      color: selected ? color.surface : today ? color.forest : disabled ? color.inkMuted : color.ink,
                    }}
                  >
                    {date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </Field>
  );
}
