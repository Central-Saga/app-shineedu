"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date | null
  setDate: (date?: Date | null) => void
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
  disabledDates?: any // Pass to Calendar
}

export function DatePicker({ date, setDate, placeholder = "Pick a date", className, id, disabled, disabledDates }: DatePickerProps) {
  return (
    <Popover open={disabled ? false : undefined}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date ?? undefined}
          onSelect={setDate as any}
          disabled={disabledDates}
          captionLayout="dropdown"
          fromYear={1950}
          toYear={new Date().getFullYear() + 2}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
