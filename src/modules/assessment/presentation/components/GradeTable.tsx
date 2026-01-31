"use client";

import type { AssessmentGrade } from "@/modules/assessment/domain/entities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Wand2 } from "lucide-react";

function formatDate(s: string | null): string {
  if (!s) return "-";
  try {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleString("id-ID");
  } catch {
    return String(s);
  }
}

interface GradeTableProps {
  grades: AssessmentGrade[];
  loading?: boolean;
  onView: (g: AssessmentGrade) => void;
  onGenerate?: (g: AssessmentGrade) => void;
}

export function GradeTable({
  grades,
  loading = false,
  onView,
  onGenerate,
}: GradeTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Siswa</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Predicate</TableHead>
            <TableHead>Generated</TableHead>
            <TableHead className="w-[100px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
              </TableRow>
            ))
          ) : grades.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-muted-foreground"
              >
                Tidak ada data nilai.
              </TableCell>
            </TableRow>
          ) : (
            grades.map((grade) => (
              <TableRow key={grade.id}>
                <TableCell className="font-medium text-muted-foreground">
                  {grade.certificate_no || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {grade.enrollment?.student?.nama_lengkap || "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      #{grade.enrollment_id}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{grade.certificate_template?.name || "-"}</span>
                    <Badge variant="secondary" className="w-fit text-[10px] h-5 capitalize">
                      {grade.certificate_template?.type || "-"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold">{grade.average_score}</span>
                    <span className="text-xs text-muted-foreground">
                      Total: {grade.total_score}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-blue-600">{grade.predicate}</span>
                  {grade.certificate_level && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({grade.certificate_level})
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {grade.generated_at ? (
                    <span className="text-emerald-600 font-medium">
                      {formatDate(grade.generated_at)}
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                      Draft
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onView(grade)}
                          className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Detail</TooltipContent>
                    </Tooltip>

                    {onGenerate && !grade.generated_at && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onGenerate(grade)}
                            className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                          >
                            <Wand2 className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Generate Certificate</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
