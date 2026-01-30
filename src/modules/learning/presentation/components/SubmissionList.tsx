"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { ReviewModal } from "./ReviewModal";
import type { AssignmentSubmission } from "@/modules/learning/domain/entities";
import { FileText, MessageSquare, Star } from "lucide-react";

interface SubmissionListProps {
  submissions: AssignmentSubmission[];
  onReviewSuccess: () => void;
}

export function SubmissionList({ submissions, onReviewSuccess }: SubmissionListProps) {
  const [reviewSubmission, setReviewSubmission] = useState<AssignmentSubmission | null>(null);

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2" />
        <p>Belum ada submission</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dari</TableHead>
            <TableHead>Dikirim</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Nilai</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((sub) => (
            <TableRow key={sub.id}>
              <TableCell className="font-medium">
                {sub.submitted_by_user?.name || "Unknown"}
              </TableCell>
              <TableCell>
                {sub.submitted_at
                  ? new Date(sub.submitted_at).toLocaleString("id-ID")
                  : "-"}
              </TableCell>
              <TableCell>
                <StatusBadge status={sub.status} />
              </TableCell>
              <TableCell>
                {sub.score !== null ? (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {sub.score}
                  </span>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewSubmission(sub)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ReviewModal
        submission={reviewSubmission}
        open={reviewSubmission !== null}
        onOpenChange={(open) => !open && setReviewSubmission(null)}
        onSuccess={() => {
          setReviewSubmission(null);
          onReviewSuccess();
        }}
      />
    </>
  );
}
