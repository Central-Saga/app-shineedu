"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A lightweight, accessible Accordion component.
 * Simplified for form usage to avoid heavy dependencies if not present.
 */

interface AccordionContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue>({});

interface AccordionItemContextValue {
  isOpen: boolean;
  value: string;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue>({
  isOpen: false,
  value: "",
});

export function Accordion({
  children,
  className,
  defaultValue,
  value,
  onValueChange,
  type = "single",
  collapsible = false,
}: {
  children: React.ReactNode;
  className?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  type?: "single" | "multiple";
  collapsible?: boolean;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  
  const currentValue = value !== undefined ? value : internalValue;
  const handleChange = (val: string) => {
    // Basic single/collapsible logic
    const newValue = collapsible && currentValue === val ? "" : val;
    
    if (onValueChange) onValueChange(newValue);
    setInternalValue(newValue);
  };

  return (
    <AccordionContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}


export function AccordionItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(AccordionContext);
  const isOpen = context.value === value;

  return (
    <AccordionItemContext.Provider value={{ isOpen, value }}>
      <div
        className={cn(
          "rounded-2xl border bg-card text-card-foreground shadow-sm transition-all",
          isOpen ? "ring-1 ring-blue-500/20" : "hover:bg-slate-50/50",
          className
        )}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({
  children,
  className,
  description,
  // These are kept for backward compatibility if any, but now use Context
  isOpen: propsIsOpen,
  value: propsValue,
}: {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  value?: string;
  description?: string;
}) {
  const context = React.useContext(AccordionContext);
  const itemContext = React.useContext(AccordionItemContext);
  
  const value = propsValue || itemContext.value;
  const isOpen = propsIsOpen !== undefined ? propsIsOpen : itemContext.isOpen;

  return (
    <button
      type="button"
      onClick={() => context.onValueChange?.(context.value === value ? "" : (value || ""))}
      className={cn(
        "flex w-full items-center justify-between px-6 py-4 text-left font-medium transition-all focus:outline-none",
        className
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-bold text-slate-900">{children}</span>
        {description && <span className="text-xs font-normal text-muted-foreground">{description}</span>}
      </div>
      <ChevronDown
        className={cn(
          "size-5 shrink-0 text-slate-400 transition-transform duration-200",
          isOpen && "rotate-180 text-blue-500"
        )}
      />
    </button>
  );
}

export function AccordionContent({
  children,
  className,
  isOpen: propsIsOpen,
}: {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}) {
  const itemContext = React.useContext(AccordionItemContext);
  const isOpen = propsIsOpen !== undefined ? propsIsOpen : itemContext.isOpen;

  if (!isOpen) return null;

  return (
    <div className={cn("px-6 pb-6 pt-0 animate-in fade-in slide-in-from-top-2 duration-200", className)}>
      <div className="pt-4 border-t border-slate-100">{children}</div>
    </div>
  );
}

