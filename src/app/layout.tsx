import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { COMMUNITY_NAME } from "@/lib/branding";
import "./globals.css";

// Configure Hebrew-supporting Google Font
const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: `${COMMUNITY_NAME} | פורטל הקהילה`,
  description: `מערכת ניהול וחיבור קהילתי - ${COMMUNITY_NAME}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={rubik.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}