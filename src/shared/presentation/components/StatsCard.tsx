"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "danger" | "info";
  description?: string;
  className?: string;
}

const iconVariants = {
  primary: "bg-blue-600/10 text-blue-600",
  success: "bg-emerald-600/10 text-emerald-600",
  warning: "bg-amber-600/10 text-amber-600",
  danger: "bg-rose-600/10 text-rose-600",
  info: "bg-sky-600/10 text-sky-600",
};

export function StatsCard({
  label,
  value,
  icon: Icon,
  variant = "primary",
  description,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden border-none shadow-sm transition-all hover:shadow-md", className)}>
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className={cn("w-1.5 shrink-0", 
            variant === "primary" && "bg-blue-500",
            variant === "success" && "bg-emerald-500",
            variant === "warning" && "bg-amber-500",
            variant === "danger" && "bg-rose-500",
            variant === "info" && "bg-sky-500",
          )} />
          <div className="flex flex-1 items-center gap-4 p-5">
            <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl transition-colors", iconVariants[variant])}>
              <Icon className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground truncate">{label}</p>
              <h3 className="text-2xl font-bold tracking-tight">
                <AnimatedNumber value={value} />
              </h3>
              {description && (
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{description}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
