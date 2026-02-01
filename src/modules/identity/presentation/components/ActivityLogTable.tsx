"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Eye } from "lucide-react";
import {
  ActivityLog,
  activityLogService,
  PaginatedActivityLogs,
} from "@/modules/identity/infrastructure/activity-log.service";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ActivityLogTable() {
  const [data, setData] = useState<PaginatedActivityLogs | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await activityLogService.getLogs({
        page,
        per_page: 20,
        search: searchDebounced,
      });
      setData(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounced]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function getEventColor(event: string | null) {
    switch (event) {
      case "created":
        return "bg-green-100 text-green-800 border-green-200";
      case "updated":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "deleted":
        return "bg-red-100 text-red-800 border-red-200";
      case "login":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "logout":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari aktivitas..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Tidak ada data aktivitas.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap font-medium text-xs">
                    {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: idLocale })}
                  </TableCell>
                  <TableCell>
                    {log.causer ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{log.causer.name}</span>
                        <span className="text-xs text-muted-foreground">{log.causer.email}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getEventColor(log.event || log.log_name)}>
                      {log.event || log.log_name}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate" title={log.description}>
                    {log.description}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.subject_type?.split('\\').pop()} #{log.subject_id}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Halaman {data.current_page} dari {data.last_page} (Total {data.total})
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
              disabled={page === data.last_page || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selectedLog} onOpenChange={(o) => !o && setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Aktivitas</DialogTitle>
            <DialogDescription>
              Detail lengkap log aktivitas sistem.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-muted-foreground">User</h4>
                    <p>{selectedLog.causer?.name || 'System'}</p>
                    <p className="text-xs text-muted-foreground">{selectedLog.causer?.email}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-muted-foreground">Waktu</h4>
                    <p>{format(new Date(selectedLog.created_at), "dd MMMM yyyy HH:mm:ss", { locale: idLocale })}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-muted-foreground">Event</h4>
                    <Badge variant="outline" className={getEventColor(selectedLog.event || selectedLog.log_name)}>
                        {selectedLog.event || selectedLog.log_name}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold text-muted-foreground">Subject</h4>
                    <p>{selectedLog.subject_type} #{selectedLog.subject_id}</p>
                  </div>
               </div>
               
               <div>
                 <h4 className="font-semibold text-muted-foreground mb-1 text-sm">Deskripsi</h4>
                 <p className="text-sm border p-2 rounded-md bg-muted/20">{selectedLog.description}</p>
               </div>

               <div>
                 <h4 className="font-semibold text-muted-foreground mb-1 text-sm">Properties (Changes)</h4>
                 <pre className="text-xs bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words max-h-[400px]">
                   {JSON.stringify(selectedLog.properties, null, 2)}
                 </pre>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
