"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assignmentRepository } from "@/modules/learning/infrastructure/assignment.repository";
import { Loader2, Upload, X } from "lucide-react";

interface SubmissionFormProps {
  assignmentId: number;
  onSuccess: () => void;
}

export function SubmissionForm({ assignmentId, onSuccess }: SubmissionFormProps) {
  const [loading, setLoading] = useState(false);
  const [contentText, setContentText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 100MB max
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 100MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contentText.trim() && !file) {
      toast.error("Harap isi jawaban atau lampirkan file");
      return;
    }

    setLoading(true);
    try {
      if (file) {
        await assignmentRepository.submitWithFile(assignmentId, file, contentText);
      } else {
        await assignmentRepository.submit(assignmentId, { content_text: contentText });
      }
      toast.success("Tugas berhasil dikumpulkan");
      setContentText("");
      setFile(null);
      onSuccess();
    } catch (error) {
      toast.error("Gagal mengirim tugas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Kumpulkan Tugas</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Jawaban</label>
            <Textarea
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="Tulis jawaban kamu di sini..."
              rows={5}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Lampiran (Opsional)
            </label>
            {file ? (
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                <Upload className="h-4 w-4" />
                <span className="text-sm flex-1 truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip,.rar"
              />
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Max 100MB. Format: PDF, DOC, XLS, PPT, gambar, ZIP
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kirim Tugas
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
