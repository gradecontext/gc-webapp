import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { CompanyDetailsModal } from "@/components/auth/CompanyDetailsModal";
import { PendingApprovalScreen } from "@/components/auth/PendingApprovalScreen";

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  title: "ContextGrade | Decision Intelligence",
  description: "Decision intelligence for onboarding, pricing, and trust.",
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-screen bg-haze-50 text-ink-900">
        <AuthProvider>
          {children}
          <CompanyDetailsModal />
          <PendingApprovalScreen />
        </AuthProvider>
      </body>
    </html>
  );
}
