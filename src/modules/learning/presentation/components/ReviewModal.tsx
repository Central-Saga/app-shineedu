"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignmentRepository } from "@/modules/learning/infrastructure/assignment.repository";
import type { AssignmentSubmission } from "@/modules/learning/domain/entities";
import { Loader2 } from "lucide-react";

interface ReviewModalProps {
  submission: AssignmentSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ReviewModal({ submission, open, onOpenChange, onSuccess }: ReviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"ACCEPTED" | "REVISION_REQUESTED">("ACCEPTED");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState("");

  const handleSubmit = async () => {
    if (!submission) return;

    setLoading(true);
    try {
      await assignmentRepository.reviewSubmission(submission.id, {
        status,
        feedback: feedback || undefined,
        score: score ? Number(score) : undefined,
      });
      toast.success("Review berhasil disimpan");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error("Gagal menyimpan review");
    } finally {
      setLoading(false);
    }
  };

  // Reset form when opening
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && submission) {
      setStatus("ACCEPTED");
      setFeedback(submission.feedback || "");
      setScore(submission.score?.toString() || "");
    }
    onOpenChange(newOpen);
  };

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Submission</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Dari: {submission.submitted_by_user?.name || "Unknown"}
            </p>
            <p className="text-sm text-muted-foreground">
              Dikirim: {submission.submitted_at
                ? new Date(submission.submitted_at).toLocaleString("id-ID")
                : "-"}
            </p>
          </div>

          {submission.content_text && (
            <div>
              <label className="text-sm font-medium">Jawaban:</label>
              <div className="mt-1 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {submission.content_text}
              </div>
            </div>
          )}

          {submission.attachment_url && (
            <div>
              <label className="text-sm font-medium">Lampiran:</label>
              <a
                href={submission.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-1 text-sm text-primary hover:underline"
              >
                Lihat Lampiran
              </a>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Status *</label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as "ACCEPTED" | "REVISION_REQUESTED")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACCEPTED">Diterima</SelectItem>
                <SelectItem value="REVISION_REQUESTED">Minta Revisi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Nilai (0-100)</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Opsional"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Feedback</label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Berikan feedback untuk murid..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
