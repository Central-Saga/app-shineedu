
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePickerWithRange({
  className,
  date,
  setDate,
  disabled,
  disabledDates,
}: React.HTMLAttributes<HTMLDivElement> & {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  disabled?: boolean
  disabledDates?: any
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={disabled ? false : undefined}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal h-10",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd LLL y")} -{" "}
                  {format(date.to, "dd LLL y")}
                </>
              ) : (
                format(date.from, "dd LLL y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            disabled={disabledDates}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
