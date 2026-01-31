import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthStoreHydration } from "@/shared/presentation/AuthStoreHydration";
import SessionTimeout from "@/shared/presentation/components/SessionTimeout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shine Edu - Admin Panel",
  description: "Admin Panel Shine Education Bali",
  icons: {
    icon: [
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon_io/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/favicon_io/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/favicon_io/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">
        <AuthStoreHydration />
        <SessionTimeout />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
