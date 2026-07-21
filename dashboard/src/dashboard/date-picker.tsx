import { es } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { dateFromIso, formatDate, isoFromDate } from "./model";

type DatePickerProps = {
  disableFuture?: boolean;
  onChange: (value: string | undefined) => void;
  value?: string;
};

export function DatePicker({ disableFuture = false, onChange, value }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = dateFromIso(value);

  return (
    <div className="flex items-center gap-2">
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger render={<Button className="w-full justify-start" variant="outline" />}>
          <CalendarIcon data-icon="inline-start" />
          {selected ? formatDate(value) : "Elegir fecha"}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            disabled={disableFuture ? { after: new Date() } : undefined}
            locale={es}
            mode="single"
            onSelect={(next) => {
              onChange(next ? isoFromDate(next) : undefined);
              setOpen(false);
            }}
            selected={selected}
          />
        </PopoverContent>
      </Popover>
      {value ? (
        <Button aria-label="Quitar fecha" onClick={() => onChange(undefined)} size="icon-sm" type="button" variant="ghost">
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}
