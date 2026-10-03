import "./globals.css";
import Script from "next/script";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import MigrationPrompt from "@/components/auth/MigrationPrompt";
import ReportIssueButton from "@/components/shared/ReportIssueButton";
import OfflineNotice from "@/components/shared/OfflineNotice";
import PushActivityTracker from "@/components/shared/PushActivityTracker";
import AdminAccessNotice from "@/components/shared/AdminAccessNotice";
import ReadingAttemptOutboxSync from "@/components/shared/ReadingAttemptOutboxSync";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mukh4mmadovoriginal.vercel.app"),
  alternates: { canonical: "/" },
  manifest: "/site.webmanifest",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  title: {
    default: "Mukh4mmadov IELTS | Complete IELTS Practice",
    template: "%s | Mukh4mmadov IELTS",
  },
  description:
    "Prepare for IELTS with focused practice, coaching, and progress tracking.",
  keywords: ["IELTS", "listening", "reading", "writing", "speaking", "practice"],
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
    siteName: "Mukh4mmadov IELTS",
    title: "Mukh4mmadov IELTS | Complete IELTS Practice",
    description: "Prepare for IELTS with focused practice, coaching, and progress tracking.",
    images: [{ url: "/og-reading.svg", width: 1200, height: 630, alt: "IELTS Reading Practice" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mukh4mmadov IELTS | Complete IELTS Practice",
    description: "Prepare for IELTS with focused practice, coaching, and progress tracking.",
    images: ["/og-reading.svg"],
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
        <Script id="offline-navigation-guard" strategy="beforeInteractive">
          {'if (navigator.onLine === false && location.pathname !== "/offline.html") location.replace("/offline.html");'}
        </Script>
        <AuthProvider>
          <ReadingAttemptOutboxSync />
          <PushActivityTracker />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            Skip to content
          </a>
          <Navbar />
          <MigrationPrompt />
          <div id="main-content" tabIndex={-1} className="min-h-screen outline-none">
            {children}
          </div>
          <OfflineNotice />
          <Footer />
          <AdminAccessNotice />
          <ReportIssueButton />
        </AuthProvider>
      </body>
    </html>
  );
}
