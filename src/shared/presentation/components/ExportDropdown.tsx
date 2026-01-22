import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";


interface ExportDropdownProps {
  onExport: (format: string) => Promise<void>;
  loading?: boolean;
}

export function ExportDropdown({ onExport, loading = false }: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: string) => {
    if (isExporting || loading) return;
    setIsExporting(true);
    const toastId = toast.loading("Mengunduh file...");
    try {
      await onExport(format);
      toast.success("Export berhasil", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Gagal melakukan export", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting || loading}>
          <Download className="mr-2 size-4" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Pilih Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>Excel (.xlsx)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")}>CSV (.csv)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("tsv")}>TSV (.tsv)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>PDF (.pdf)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("txt")}>Text (.txt)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("sql")}>SQL Insert (.sql)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
