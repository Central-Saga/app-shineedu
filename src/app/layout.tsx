import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthStoreHydration } from "@/shared/presentation/AuthStoreHydration";
import SessionTimeout from "@/shared/presentation/components/SessionTimeout";
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
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">
        {/* <AuthStoreHydration /> */}
        {/* <SessionTimeout /> */}
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
