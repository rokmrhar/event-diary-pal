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
  /** Pick year, then month, then day; opens on today */
  drilldown?: boolean;
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
  drilldown,
}: DatePickerSIProps) {
  const date = React.useMemo(() => {
    if (!value) return undefined;
    const d = parse(value, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : undefined;
  }, [value]);

  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<"year" | "month" | "day">("day");
  const [month, setMonth] = React.useState<Date>(date ?? new Date());
  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o) { setMonth(date ?? new Date()); setView(drilldown ? "year" : "day"); }
  };
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Avg", "Sep", "Okt", "Nov", "Dec"];
  const curYear = month.getFullYear();
  const yearStart = curYear - (curYear % 12);

  return (
    <Popover open={open} onOpenChange={handleOpen}>
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
        {view === "year" && (
          <div className="p-3 w-[280px] pointer-events-auto">
            <div className="flex items-center justify-between mb-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setMonth(new Date(curYear - 12, month.getMonth(), 1))}>‹</Button>
              <span className="text-sm font-medium">{yearStart} – {yearStart + 11}</span>
              <Button type="button" size="sm" variant="ghost" onClick={() => setMonth(new Date(curYear + 12, month.getMonth(), 1))}>›</Button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 12 }, (_, i) => yearStart + i).map((y) => (
                <Button key={y} type="button" size="sm" variant={y === curYear ? "default" : "ghost"}
                  onClick={() => { setMonth(new Date(y, month.getMonth(), 1)); setView("month"); }}>{y}</Button>
              ))}
            </div>
          </div>
        )}
        {view === "month" && (
          <div className="p-3 w-[280px] pointer-events-auto">
            <button type="button" className="text-sm font-medium mb-2 w-full text-center hover:underline" onClick={() => setView("year")}>{curYear}</button>
            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((m, i) => (
                <Button key={m} type="button" size="sm" variant={i === month.getMonth() ? "default" : "ghost"}
                  onClick={() => { setMonth(new Date(curYear, i, 1)); setView("day"); }}>{m}</Button>
              ))}
            </div>
          </div>
        )}
        {view === "day" && drilldown && (
          <button type="button" className="text-xs text-muted-foreground hover:underline w-full pt-2" onClick={() => setView("year")}>Izberi leto / mesec</button>
        )}
        {view === "day" && <Calendar
          month={month}
          onMonthChange={setMonth}
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
        />}
      </PopoverContent>
    </Popover>
  );
}