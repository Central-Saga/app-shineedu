"use client";

import { Badge } from "@/components/ui/badge";
import type { AssignmentStatus, SubmissionStatus } from "@/modules/learning/domain/entities";

interface StatusBadgeProps {
  status: AssignmentStatus | SubmissionStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  // Assignment statuses
  ASSIGNED: { label: "Ditugaskan", variant: "secondary" },
  SUBMITTED: { label: "Dikirim", variant: "default" },
  REVIEWED: { label: "Direview", variant: "outline" },
  CLOSED: { label: "Ditutup", variant: "destructive" },
  // Submission statuses  
  REVISION_REQUESTED: { label: "Revisi", variant: "destructive" },
  ACCEPTED: { label: "Diterima", variant: "default" },
  // Materi active status
  ACTIVE: { label: "Aktif", variant: "default" },
  INACTIVE: { label: "Nonaktif", variant: "secondary" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

interface ActiveBadgeProps {
  isActive: boolean;
  className?: string;
}

export function ActiveBadge({ isActive, className }: ActiveBadgeProps) {
  return (
    <Badge 
      variant={isActive ? "default" : "secondary"} 
      className={className}
    >
      {isActive ? "Aktif" : "Nonaktif"}
    </Badge>
  );
}

interface DueBadgeProps {
  dueAt?: string | null;
  isOverdue?: boolean;
  className?: string;
}

export function DueBadge({ dueAt, isOverdue, className }: DueBadgeProps) {
  if (!dueAt) return null;
  
  const dueDate = new Date(dueAt);
  const now = new Date();
  const overdue = isOverdue ?? dueDate < now;
  
  return (
    <Badge 
      variant={overdue ? "destructive" : "outline"} 
      className={className}
    >
      {overdue ? "Terlambat" : dueDate.toLocaleDateString("id-ID")}
    </Badge>
  );
}
