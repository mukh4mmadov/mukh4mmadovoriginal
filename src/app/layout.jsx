import { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import MigrationPrompt from "@/components/auth/MigrationPrompt";
import ReportIssueButton from "@/components/shared/ReportIssueButton";
import OfflineNotice from "@/components/shared/OfflineNotice";

export const metadata = {
  title: {
    default: "Muhammadov IELTS Reading",
    template: "%s | Muhammadov IELTS Reading",
  },
  description:
    "Practice IELTS Reading with exam-format passages, a built-in highlighter, and instant band estimates.",
  keywords: ["IELTS", "reading", "practice", "exam", "study"],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Muhammadov IELTS Reading",
    title: "Muhammadov IELTS Reading",
    description:
      "Practice IELTS Reading with exam-format passages, a built-in highlighter, and instant band estimates.",
  },
  twitter: {
    card: "summary",
    title: "Muhammadov IELTS Reading",
    description:
      "Practice IELTS Reading with exam-format passages, a built-in highlighter, and instant band estimates.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            Skip to content
          </a>
          <Navbar />
          <div id="main-content" tabIndex={-1} className="min-h-screen outline-none">
            {children}
          </div>
          <OfflineNotice />
          <Footer />
          <MigrationPrompt />
          <ReportIssueButton />
        </AuthProvider>
      </body>
    </html>
  );
}
