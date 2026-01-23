"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraCapture } from "@/components/ui/camera-capture";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkIn, checkOut, getTodayAbsensi } from "@/modules/absensi/infrastructure/absensi.repository";
import { toast } from "sonner";
import { MapPin, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import type { Absensi } from "@/modules/absensi/domain/entities";

export default function AbsensiScanPage() {
  const { allowed } = usePermissionGuard("absensi.create");
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; long: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("check-in");
  const [todayAbsensi, setTodayAbsensi] = useState<Absensi | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      getLocation();
      try {
        const status = await getTodayAbsensi();
        setTodayAbsensi(status);
        
        // Auto select tab
        if (!status) {
          setActiveTab("check-in");
        } else if (status.jam_masuk && !status.jam_pulang) {
          setActiveTab("check-out");
        }
      } catch (e) {
        console.error("Gagal mengambil status absensi:", e);
      } finally {
        setIsInitialLoading(false);
      }
    };
    init();
  }, []);

  const getLocation = () => {
    setError(null);
    if ("geolocation" in navigator) {
      const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
      
      const success = (position: GeolocationPosition) => {
        setLocation({
          lat: position.coords.latitude,
          long: position.coords.longitude,
        });
      };

      const failure = (err: GeolocationPositionError) => {
        // Fallback: If High Accuracy fails, try normal accuracy
        if (options.enableHighAccuracy) {
          console.warn("High accuracy failed, retrying with normal accuracy...", err);
          options.enableHighAccuracy = false;
          options.timeout = 10000;
          navigator.geolocation.getCurrentPosition(success, finalFailure, options);
        } else {
          finalFailure(err);
        }
      };

      const finalFailure = (err: GeolocationPositionError) => {
        let msg = "Gagal mendapatkan lokasi.";
        if (err.code === 1) {
          msg = "Izin lokasi ditolak. Mohon izinkan akses lokasi di browser.";
        } else if (err.code === 2) {
          msg = "Posisi tidak tersedia. Pastikan GPS/WiFi aktif dan Izin Lokasi di Sistem Operasi (Mac/Windows/Android/iOS) sudah dinyalakan untuk browser ini.";
        } else if (err.code === 3) {
          msg = "Waktu permintaan lokasi habis (Sinyal lemah).";
        }
        
        setError(`${msg}`);
        console.error("Geolocation Error:", err);
      };

      navigator.geolocation.getCurrentPosition(success, failure, options);
    } else {
      setError("Browser tidak mendukung Geolocation.");
    }
  };

  const handleScan = async (file: File) => {
    if (!location) {
      toast.error("Lokasi belum ditemukan. Tunggu sebentar or aktifkan GPS.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("latitude", String(location.lat));
    formData.append("longitude", String(location.long));

    try {
      if (activeTab === "check-in") {
        await checkIn(formData);
        toast.success("Check-in berhasil!");
      } else {
        await checkOut(formData);
        toast.success("Check-out berhasil!");
      }
      router.push("/absensi");
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Gagal melakukan absensi");
    } finally {
      setLoading(false);
    }
  };

  if (!allowed) return null;

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground animate-pulse">Memuat status absensi...</p>
      </div>
    );
  }

  const isCheckedIn = !!todayAbsensi?.jam_masuk;
  const isCheckedOut = !!todayAbsensi?.jam_pulang;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/absensi">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Absensi Scanner</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Lokasi Anda</CardTitle>
            <MapPin className={`size-5 ${location ? "text-green-500" : "text-gray-400"}`} />
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="space-y-2">
              <p className="text-destructive text-sm font-medium leading-relaxed">{error}</p>
              <Button variant="outline" size="sm" onClick={getLocation} className="w-full">
                Coba Cari Lokasi Lagi
              </Button>
            </div>
          ) : location ? (
            <p className="text-sm text-muted-foreground">
              {location.lat.toFixed(6)}, {location.long.toFixed(6)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground animate-pulse">Mencari lokasi...</p>
          )}
        </CardContent>
      </Card>

      {isCheckedIn && isCheckedOut ? (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="size-8 text-green-600" />
              </div>
            </div>
            <h3 className="font-bold text-green-900">Absensi Selesai!</h3>
            <p className="text-sm text-green-700">Anda sudah melakukan check-in dan check-out untuk hari ini.</p>
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <Link href="/absensi">Lihat Data Absensi</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="check-in" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="check-in" disabled={isCheckedIn}>
              Check In {isCheckedIn && "✓"}
            </TabsTrigger>
            <TabsTrigger value="check-out" disabled={!isCheckedIn || isCheckedOut}>
              Check Out {isCheckedOut && "✓"}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <CameraCapture 
                  onCapture={handleScan} 
                  label={activeTab === "check-in" ? "Foto & Masuk" : "Foto & Pulang"} 
                />
                {loading && <p className="text-center text-sm text-muted-foreground mt-2">Memproses...</p>}
              </CardContent>
            </Card>
          </div>
        </Tabs>
      )}
    </div>
  );
}
