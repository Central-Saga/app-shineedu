import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImportModalProps {
  onImport: (file: File) => Promise<void>;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  sampleUrl?: string; // Optional: Link to download sample template
}

export function ImportModal({ 
  onImport, 
  trigger, 
  title = "Import Data", 
  description = "Upload file Excel, CSV, atau SQL untuk mengimport data." 
}: ImportModalProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Mengimport data...");
    try {
      await onImport(file);
      toast.success("Import berhasil!", { id: toastId });
      setOpen(false);
      setFile(null);
    } catch (error) {
        // Error already handled or thrown? Caller typically handles specific errors but we catch here to stop loading
        // If caller swallows error, we assume success. Ideally caller throws if fails.
        // Assuming caller throws errors including validation ones.
        console.error(error);
        if (error instanceof Error) {
             toast.error(error.message, { id: toastId });
        } else {
             toast.error("Gagal melakukan import", { id: toastId });
        }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="mr-2 size-4" />
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="file-upload">File Import</Label>
            <div className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
                file ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50"
            )}>
                {file ? (
                    <div className="flex items-center gap-2 text-primary">
                        <FileSpreadsheet className="size-8" />
                        <div className="text-center">
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Klik untuk pilih file</p>
                        <p className="text-xs text-muted-foreground">.xlsx, .csv, .tsv, .txt, .sql</p>
                    </div>
                )}
                <Input 
                    id="file-upload" 
                    type="file" 
                    className="hidden" 
                    accept=".xlsx,.xls,.csv,.tsv,.txt,.sql"
                    onChange={handleFileChange}
                    disabled={isUploading}
                />
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 w-full" 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isUploading}
                >
                    {file ? "Ganti File" : "Pilih File"}
                </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isUploading}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!file || isUploading}>
            {isUploading ? "Mengupload..." : "Import Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
