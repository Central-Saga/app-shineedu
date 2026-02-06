"use client";

import { useState, useCallback, useRef } from "react";
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
import { bulkCreateJadwalKerja } from "@/modules/jadwal-kerja/infrastructure/jadwal-kerja.repository";
import type {
  BulkCreateJadwalKerjaPayload,
  BulkCreateJadwalKerjaResponse,
  BulkCreateJadwalKerjaResult,
} from "@/modules/jadwal-kerja/domain/entities";

const REQUIRED_COLUMNS = [
  "guru_pengajar_id",
  "hari",
  "jam_mulai",
  "jam_selesai",
  "kategori",
  "tarif",
  "status",
] as const;

const OPTIONAL_COLUMNS = [
  "mata_pelajaran",
  "nomor_sesi",
  "ruangan_kelas",
  "kelas_id",
] as const;

const ALLOWED_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS] as const;

type CsvRow = Record<string, string>;

interface ParsedRow {
  guru_pengajar_id?: string;
  hari?: string;
  jam_mulai?: string;
  jam_selesai?: string;
  kategori?: string;
  tarif?: string;
  status?: string;
  mata_pelajaran?: string;
  nomor_sesi?: string;
  ruangan_kelas?: string;
  kelas_id?: string;
}

const MAX_ROWS = 1000;
const PREVIEW_ROWS = 50;

const HARI_OPTIONS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

export function JadwalKerjaBulkImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<BulkCreateJadwalKerjaResponse | null>(null);
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

        const fields = results.meta?.fields ?? [];
        const missing = REQUIRED_COLUMNS.filter((col) => !fields.includes(col));
        if (missing.length > 0) {
          toast.error(`Kolom wajib tidak ditemukan: ${missing.join(", ")}`);
          return;
        }

        const rows: ParsedRow[] = results.data
          .slice(0, MAX_ROWS)
          .map((row) => {
            const parsed: ParsedRow = {};
            ALLOWED_COLUMNS.forEach((col) => {
              const value = row[col]?.trim();
              if (value !== undefined) {
                parsed[col] = value;
              }
            });
            return parsed;
          })
          .filter((row) => Object.values(row).some((v) => v && v.trim().length > 0));

        if (rows.length === 0) {
          toast.error("Tidak ada data valid ditemukan. Pastikan file CSV terisi.");
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

  const toPayload = (): BulkCreateJadwalKerjaPayload => ({
    items: parsedData.map((row) => ({
      kategori: (row.kategori || "") as any,
      mata_pelajaran: row.mata_pelajaran || null,
      hari: row.hari || "",
      nomor_sesi: row.nomor_sesi || null,
      jam_mulai: row.jam_mulai || "",
      jam_selesai: row.jam_selesai || "",
      tarif: Number(row.tarif),
      status: (row.status || "") as any,
      ruangan_kelas: row.ruangan_kelas || null,
      guru_pengajar_id: Number(row.guru_pengajar_id),
      kelas_id: row.kelas_id ? Number(row.kelas_id) : null,
    })),
    dry_run: true,
  });

  const handleDryRun = async () => {
    setLoading(true);
    try {
      const payload = toPayload();
      const res = await bulkCreateJadwalKerja(payload);
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
      const payload = { ...toPayload(), dry_run: false };
      const res = await bulkCreateJadwalKerja(payload);
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
    a.download = "failed_import_jadwal_kerja.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: BulkCreateJadwalKerjaResult["status"]) => {
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
                Upload file CSV berisi jadwal kerja.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="jadwal-csv-upload"
              />
              <Button asChild disabled={loading}>
                <label htmlFor="jadwal-csv-upload">
                  {loading ? "Membaca file..." : "Pilih File CSV"}
                </label>
              </Button>
              {fileName && (
                <p className="text-sm text-muted-foreground mt-2">{fileName}</p>
              )}
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Kolom wajib:</p>
              <div className="flex flex-wrap gap-2">
                {REQUIRED_COLUMNS.map((col) => (
                  <Badge key={col} variant="secondary">{col}</Badge>
                ))}
              </div>
              <p className="font-medium text-foreground">Kolom opsional:</p>
              <div className="flex flex-wrap gap-2">
                {OPTIONAL_COLUMNS.map((col) => (
                  <Badge key={col} variant="outline">{col}</Badge>
                ))}
              </div>
              <p>Format waktu: `HH:mm`. Hari: {HARI_OPTIONS.join(", ")}.</p>
              <p>Kategori: `coding` / `non_coding`. Status: `Aktif` / `Non Aktif`.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="size-5" />
              Preview Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {Math.min(parsedData.length, PREVIEW_ROWS)} dari {parsedData.length} baris
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={resetState} disabled={loading}>
                  Ganti File
                </Button>
                <Button variant="outline" onClick={handleDryRun} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Validasi (Dry Run)
                </Button>
                <Button onClick={() => setConfirmOpen(true)} disabled={loading}>
                  Import
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Guru ID</TableHead>
                    <TableHead>Hari</TableHead>
                    <TableHead>Jam</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tarif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, PREVIEW_ROWS).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{row.guru_pengajar_id || "-"}</TableCell>
                      <TableCell>{row.hari || "-"}</TableCell>
                      <TableCell>{row.jam_mulai} - {row.jam_selesai}</TableCell>
                      <TableCell>{row.kategori || "-"}</TableCell>
                      <TableCell>{row.status || "-"}</TableCell>
                      <TableCell>{row.tarif || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "result" && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              Hasil Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{result.created}</p>
                <p className="text-sm text-muted-foreground">Berhasil</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                <p className="text-sm text-muted-foreground">Gagal</p>
              </div>
            </div>

            {result.failed > 0 && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-yellow-600" />
                <p className="text-sm text-muted-foreground">
                  Ada {result.failed} data gagal diproses.
                </p>
                <Button variant="secondary" onClick={downloadFailedCsv}>
                  <Download className="mr-2 size-4" />
                  Download CSV Gagal
                </Button>
              </div>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Guru ID</TableHead>
                    <TableHead>Hari</TableHead>
                    <TableHead>Jam</TableHead>
                    <TableHead>Pesan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.results.slice(0, PREVIEW_ROWS).map((row) => {
                    const original = parsedData[row.index] || {};
                    const message = row.errors
                      ? Object.entries(row.errors).map(([k, v]) => `${k}: ${v.join(", ")}`).join("; ")
                      : "-";
                    return (
                      <TableRow key={row.index}>
                        <TableCell>{row.index + 1}</TableCell>
                        <TableCell>{getStatusBadge(row.status)}</TableCell>
                        <TableCell>{original.guru_pengajar_id || "-"}</TableCell>
                        <TableCell>{original.hari || "-"}</TableCell>
                        <TableCell>{original.jam_mulai} - {original.jam_selesai}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{message}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {result.total > PREVIEW_ROWS && (
              <div className="text-sm text-muted-foreground text-center">
                Menampilkan {PREVIEW_ROWS} hasil pertama.
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={resetState}>Upload File Baru</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Import</AlertDialogTitle>
            <AlertDialogDescription>
              Data yang valid akan disimpan. Data yang gagal akan diabaikan. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleImport}>Lanjutkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memproses data...
        </div>
      )}

      {phase !== "upload" && parsedData.length > 0 && (
        <Progress value={(result?.created || 0) / parsedData.length * 100} />
      )}
    </div>
  );
}
