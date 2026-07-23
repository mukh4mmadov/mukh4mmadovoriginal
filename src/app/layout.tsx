import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";

export const metadata: Metadata = {
  title: "Muhammadov IELTS Reading",
  description:
    "Practice IELTS Reading with exam-format passages, a built-in highlighter, and instant band estimates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
