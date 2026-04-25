import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerSIProps {
  /** ISO date string (YYYY-MM-DD) or empty */
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

/**
 * Date picker that shows the date in Slovenian dd.mm.yyyy format
 * but stores it as ISO YYYY-MM-DD (compatible with HTML date inputs / Postgres date).
 */
export function DatePickerSI({
  value,
  onChange,
  placeholder = "Izberi datum",
  id,
  required,
  className,
  disabled,
}: DatePickerSIProps) {
  const date = React.useMemo(() => {
    if (!value) return undefined;
    const d = parse(value, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : undefined;
  }, [value]);

  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd.MM.yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) {
              onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            } else if (!required) {
              onChange("");
            }
          }}
          initialFocus
          weekStartsOn={1}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}