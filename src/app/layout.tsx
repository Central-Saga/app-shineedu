import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthStoreHydration } from "@/shared/presentation/AuthStoreHydration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shine Edu - Admin Panel",
  description: "Admin Panel Shine Education Bali",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        <AuthStoreHydration />
        <Toaster richColors position="top-right" />
        {children}
      </body>
    </html>
  );
}
