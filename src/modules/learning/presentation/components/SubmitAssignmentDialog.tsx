"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { assignmentRepository } from "@/modules/learning/infrastructure/assignment.repository";
import type { Assignment } from "@/modules/learning/domain/entities";
import { 
  Upload, 
  FileText, 
  Calendar, 
  CheckCircle2,
  AlertCircle,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  content_text: z.string().min(1, "Jawaban wajib diisi"),
  attachment: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SubmitAssignmentDialogProps {
  assignment: Assignment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SubmitAssignmentDialog({
  assignment,
  isOpen,
  onClose,
  onSuccess,
}: SubmitAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content_text: assignment.latest_submission?.content_text || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await assignmentRepository.submitAssignment(assignment.id, {
        content_text: values.content_text,
        attachment: selectedFile || undefined,
      });
      toast.success("Tugas berhasil dikirim");
      onSuccess();
    } catch {
      toast.error("Gagal mengirim tugas");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 10MB");
        return;
      }
      setSelectedFile(file);
      form.setValue("attachment", file);
    }
  };

  const isSubmitted = assignment.status !== 'ASSIGNED';
  const latestSubmission = assignment.latest_submission;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{assignment.title}</DialogTitle>
          <DialogDescription>
            {isSubmitted ? "Detail Tugas dan Submission" : "Kerjakan dan kirim tugas Anda"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Info */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Instruksi</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {assignment.instructions || "Tidak ada instruksi khusus"}
                </p>
              </div>

              {assignment.materi_modul && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Materi Terkait</p>
                  <Badge variant="outline" className="mt-1">
                    <FileText className="size-3 mr-1" />
                    {assignment.materi_modul.title}
                  </Badge>
                </div>
              )}

              {assignment.due_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Deadline</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(assignment.due_at).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    {assignment.is_overdue && assignment.status === 'ASSIGNED' && (
                      <Badge variant="destructive" className="ml-2">
                        <AlertCircle className="size-3 mr-1" />
                        Terlambat
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Submission Form or View */}
          {isSubmitted && latestSubmission ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Submission Anda</h3>
                <Badge 
                  variant={latestSubmission.status === 'ACCEPTED' ? 'default' : 'secondary'}
                >
                  {latestSubmission.status === 'ACCEPTED' && <CheckCircle2 className="size-3 mr-1" />}
                  {latestSubmission.status === 'ACCEPTED' ? 'Diterima' : 
                   latestSubmission.status === 'REVISION_REQUESTED' ? 'Perlu Revisi' : 
                   'Menunggu Review'}
                </Badge>
              </div>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Jawaban Anda</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg">
                      {latestSubmission.content_text || "-"}
                    </p>
                  </div>

                  {latestSubmission.attachment_url && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">File Lampiran</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(latestSubmission.attachment_url!, '_blank')}
                      >
                        <Download className="size-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Dikirim pada</p>
                    <p className="text-sm">
                      {latestSubmission.submitted_at 
                        ? new Date(latestSubmission.submitted_at).toLocaleString("id-ID")
                        : "-"}
                    </p>
                  </div>

                  {latestSubmission.feedback && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Feedback dari Guru</p>
                      <p className="text-sm whitespace-pre-wrap bg-blue-50 p-3 rounded-lg border border-blue-200">
                        {latestSubmission.feedback}
                      </p>
                    </div>
                  )}

                  {latestSubmission.score !== null && latestSubmission.score !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Nilai</p>
                      <Badge variant="default" className="text-lg px-3 py-1">
                        {latestSubmission.score}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {latestSubmission.status === 'REVISION_REQUESTED' && (
                <Button 
                  className="w-full"
                  onClick={() => {
                    // Reset form to allow resubmission
                    form.reset({
                      content_text: latestSubmission.content_text || "",
                    });
                  }}
                >
                  <Upload className="size-4 mr-2" />
                  Kirim Ulang
                </Button>
              )}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="content_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jawaban Anda *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tulis jawaban Anda di sini..."
                          rows={8}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Jelaskan jawaban Anda dengan lengkap dan jelas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attachment"
                  render={() => (
                    <FormItem>
                      <FormLabel>File Lampiran (Opsional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Format: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                      </FormDescription>
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground">
                          File dipilih: {selectedFile.name}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Mengirim..." : "Kirim Tugas"}
                    <Upload className="ml-2 size-4" />
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
