import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider, AuthProvider } from "@/providers";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Pearl Cover - Aged Care & WorkCover Expense Tracking",
    template: "%s | Pearl Cover",
  },
  description: "Track aged care funding, WorkCover claims, and expenses with ease. Digital expense management for Australian families.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pearl Cover",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
         <QueryProvider>
           <AuthProvider>
             <ErrorBoundary>
               {children}
             </ErrorBoundary>
             <Toaster position="top-right" richColors />
           </AuthProvider>
         </QueryProvider>
       </body>
     </html>
   );
 }
