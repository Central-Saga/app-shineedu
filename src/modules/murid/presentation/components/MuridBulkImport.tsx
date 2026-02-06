"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Loader2,
  Eye,
} from "lucide-react";
import { bulkCreateMurids } from "@/modules/murid/infrastructure/murid.repository";
import type {
  BulkCreateMuridPayload,
  BulkCreateResponse,
  BulkCreateResult,
} from "@/modules/murid/domain/entities";

// CSV columns we accept (whitelist)
const ALLOWED_COLUMNS = [
  "nama_lengkap",
  "jenis_kelamin",
  "tanggal_lahir",
  "no_hp",
  "email",
  "alamat",
  "status",
  "password",
] as const;

type CsvRow = Record<string, string>;

interface ParsedRow {
  nama_lengkap: string;
  jenis_kelamin?: string;
  tanggal_lahir?: string;
  no_hp?: string;
  email?: string;
  alamat?: string;
  status?: string;
  password?: string;
}

const MAX_ROWS = 1000;
const PREVIEW_ROWS = 50;

export function MuridBulkImport() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<BulkCreateResponse | null>(null);
  const [phase, setPhase] = useState<"upload" | "preview" | "result">("upload");

  const resetState = () => {
    setParsedData([]);
    setFileName("");
    setResult(null);
    setPhase("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("File harus berformat CSV");
      return;
    }

    setFileName(file.name);
    setLoading(true);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setLoading(false);

        if (results.errors.length > 0) {
          toast.error(`Error parsing CSV: ${results.errors[0].message}`);
          return;
        }

        const rows: ParsedRow[] = results.data
          .slice(0, MAX_ROWS)
          .map((row) => {
            const parsed: ParsedRow = { nama_lengkap: "" };
            ALLOWED_COLUMNS.forEach((col) => {
              const value = row[col]?.trim();
              if (value) {
                (parsed as any)[col] = value;
              }
            });
            return parsed;
          })
          .filter((row) => row.nama_lengkap); // Filter out rows without nama_lengkap

        if (rows.length === 0) {
          toast.error("Tidak ada data valid ditemukan. Pastikan kolom 'nama_lengkap' terisi.");
          return;
        }

        if (results.data.length > MAX_ROWS) {
          toast.warning(`Hanya ${MAX_ROWS} baris pertama yang akan diproses.`);
        }

        setParsedData(rows);
        setPhase("preview");
      },
      error: (err) => {
        setLoading(false);
        toast.error(`Error membaca file: ${err.message}`);
      },
    });
  }, []);

  const handleDryRun = async () => {
    setLoading(true);
    try {
      const payload: BulkCreateMuridPayload = {
        items: parsedData.map((row) => ({
          nama_lengkap: row.nama_lengkap,
          jenis_kelamin: row.jenis_kelamin as "L" | "P" | undefined,
          tanggal_lahir: row.tanggal_lahir,
          no_hp: row.no_hp,
          email: row.email,
          alamat: row.alamat,
          status: row.status as "Aktif" | "Non Aktif" | undefined,
          password: row.password,
        })),
        dry_run: true,
      };

      const res = await bulkCreateMurids(payload);
      setResult(res);
      setPhase("result");
      toast.success(`Validasi selesai: ${res.valid} valid, ${res.failed} gagal`);
    } catch (err: any) {
      toast.error(err.message || "Gagal melakukan validasi");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      const payload: BulkCreateMuridPayload = {
        items: parsedData.map((row) => ({
          nama_lengkap: row.nama_lengkap,
          jenis_kelamin: row.jenis_kelamin as "L" | "P" | undefined,
          tanggal_lahir: row.tanggal_lahir,
          no_hp: row.no_hp,
          email: row.email,
          alamat: row.alamat,
          status: row.status as "Aktif" | "Non Aktif" | undefined,
          password: row.password,
        })),
        dry_run: false,
      };

      const res = await bulkCreateMurids(payload);
      setResult(res);
      setPhase("result");
      toast.success(`Import selesai: ${res.created} dibuat, ${res.failed} gagal`);
    } catch (err: any) {
      toast.error(err.message || "Gagal melakukan import");
    } finally {
      setLoading(false);
    }
  };

  const downloadFailedCsv = () => {
    if (!result) return;

    const failedRows = result.results.filter((r) => r.status === "failed");
    if (failedRows.length === 0) {
      toast.info("Tidak ada data yang gagal");
      return;
    }

    const csvData = failedRows.map((row) => {
      const original = parsedData[row.index] || {};
      return {
        ...original,
        error: row.errors ? Object.entries(row.errors).map(([k, v]) => `${k}: ${v.join(", ")}`).join("; ") : "",
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "failed_import_murid.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: BulkCreateResult["status"]) => {
    switch (status) {
      case "created":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="mr-1 size-3" />Dibuat</Badge>;
      case "valid":
        return <Badge className="bg-blue-100 text-blue-800"><Eye className="mr-1 size-3" />Valid</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="mr-1 size-3" />Gagal</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Phase */}
      {phase === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5" />
              Upload CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="mx-auto size-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Upload file CSV dengan kolom:
              </p>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                nama_lengkap, jenis_kelamin, tanggal_lahir, no_hp, email, alamat, status, password
              </code>
              <div className="mt-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <Button asChild disabled={loading}>
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Membaca file...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 size-4" />
                        Pilih File CSV
                      </>
                    )}
                  </label>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Maksimal {MAX_ROWS} baris per import
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Phase */}
      {phase === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="size-5" />
                Preview Data ({parsedData.length} baris)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetState}>
                  Batal
                </Button>
                <Button variant="secondary" onClick={handleDryRun} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Eye className="mr-2 size-4" />}
                  Dry Run
                </Button>
                <Button onClick={() => setConfirmOpen(true)} disabled={loading}>
                  <Upload className="mr-2 size-4" />
                  Import
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded border overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>JK</TableHead>
                    <TableHead>Tgl Lahir</TableHead>
                    <TableHead>No HP</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, PREVIEW_ROWS).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{row.nama_lengkap}</TableCell>
                      <TableCell>{row.jenis_kelamin || "-"}</TableCell>
                      <TableCell>{row.tanggal_lahir || "-"}</TableCell>
                      <TableCell>{row.no_hp || "-"}</TableCell>
                      <TableCell>{row.email || "-"}</TableCell>
                      <TableCell>{row.status || "Aktif"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsedData.length > PREVIEW_ROWS && (
              <p className="text-sm text-muted-foreground mt-2">
                Menampilkan {PREVIEW_ROWS} dari {parsedData.length} baris
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Result Phase */}
      {phase === "result" && result && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{result.total}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            {result.dry_run ? (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-700">{result.valid}</div>
                  <p className="text-sm text-blue-600">Valid</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-700">{result.created}</div>
                  <p className="text-sm text-green-600">Dibuat</p>
                </CardContent>
              </Card>
            )}
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-700">{result.failed}</div>
                <p className="text-sm text-red-600">Gagal</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col gap-2">
                <Progress value={(result.dry_run ? result.valid : result.created) / result.total * 100} />
                <p className="text-sm text-muted-foreground">
                  {((result.dry_run ? result.valid : result.created) / result.total * 100).toFixed(0)}% sukses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetState}>
              Import Lagi
            </Button>
            {result.failed > 0 && (
              <Button variant="secondary" onClick={downloadFailedCsv}>
                <Download className="mr-2 size-4" />
                Download Gagal CSV
              </Button>
            )}
            <Button onClick={() => router.push("/dashboard/murid")}>
              Kembali ke Daftar
            </Button>
          </div>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Hasil Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded border overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Kode Murid</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.results.map((row) => (
                      <TableRow key={row.index}>
                        <TableCell className="text-muted-foreground">{row.index + 1}</TableCell>
                        <TableCell className="font-medium">{row.nama_lengkap}</TableCell>
                        <TableCell>{getStatusBadge(row.status)}</TableCell>
                        <TableCell>{row.kode_murid || "-"}</TableCell>
                        <TableCell className="text-red-600 text-sm">
                          {row.errors
                            ? Object.entries(row.errors)
                                .map(([k, v]) => `${k}: ${v.join(", ")}`)
                                .join("; ")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-yellow-500" />
              Konfirmasi Import
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mengimport <strong>{parsedData.length}</strong> data murid.
              Tindakan ini akan membuat record permanen di database.
              <br /><br />
              Disarankan untuk menjalankan <strong>Dry Run</strong> terlebih dahulu untuk memvalidasi data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleImport}>
              Ya, Import Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
