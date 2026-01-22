"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraCapture } from "@/components/ui/camera-capture";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkIn, checkOut } from "@/modules/absensi/infrastructure/absensi.repository";
import { toast } from "sonner";
import { MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";

export default function AbsensiScanPage() {
  const { allowed } = usePermissionGuard("absensi.create");
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; long: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("check-in");

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    setError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            long: position.coords.longitude,
          });
        },
        (err) => {
          let msg = "Gagal mendapatkan lokasi.";
          if (err.code === 1) msg = "Izin lokasi ditolak. Mohon izinkan akses lokasi di browser.";
          else if (err.code === 2) msg = "Posisi tidak tersedia (pastikan GPS/WiFi aktif).";
          else if (err.code === 3) msg = "Waktu permintaan lokasi habis.";
          
          setError(`${msg} (${err.message})`);
          console.error(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError("Browser tidak mendukung Geolocation.");
    }
  };

  const useMockLocation = () => {
    setLocation({ lat: -8.670458, long: 115.212629 }); // Denpasar coordinates
    setError(null);
    toast.info("Menggunakan lokasi mock (Denpasar)");
  };

  const handleScan = async (file: File) => {
    if (!location) {
      toast.error("Lokasi belum ditemukan. Tunggu sebentar atau aktifkan GPS.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("latitude", String(location.lat));
    formData.append("longitude", String(location.long));
    // QR data logic could be added here if we had a scanner active simultaneously
    // formData.append("qr_data", "...");

    try {
      if (activeTab === "check-in") {
        await checkIn(formData);
        toast.success("Check-in berhasil!");
      } else {
        await checkOut(formData);
        toast.success("Check-out berhasil!");
      }
      router.push("/absensi");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Gagal melakukan absensi");
    } finally {
      setLoading(false);
    }
  };

  if (!allowed) return null;

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
              <p className="text-destructive text-sm font-medium">{error}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={getLocation}>
                  Coba Lagi
                </Button>
                <Button variant="secondary" size="sm" onClick={useMockLocation}>
                  Pakai Lokasi Mock (Dev)
                </Button>
              </div>
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

      <Tabs defaultValue="check-in" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="check-in">Check In</TabsTrigger>
          <TabsTrigger value="check-out">Check Out</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <CameraCapture onCapture={handleScan} label={activeTab === "check-in" ? "Foto & Masuk" : "Foto & Pulang"} />
              {loading && <p className="text-center text-sm text-muted-foreground mt-2">Memproses...</p>}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
