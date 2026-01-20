"use client";

import { AppBreadcrumbs } from "@/shared/presentation/components/AppBreadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div>
      <AppBreadcrumbs items={[{ label: "Dashboard" }]} />
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Selamat datang</CardTitle>
            <CardDescription>Admin Panel Shine Education Bali</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Gunakan menu di sisi kiri untuk mengelola Users, Roles, dan Karyawan.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
