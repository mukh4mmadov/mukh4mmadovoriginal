import Link from "next/link";
import LegalPage from "@/components/shared/LegalPage";

export const metadata = {
  title: "Contact",
  description: "Contact and support information for IELTS Reading Pro.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <LegalPage
      title="Contact"
      updatedAt="October 3, 2026"
      intro="For questions or issues with IELTS Reading Pro, use one of the contact methods below. The service is operated by Muhammadov Ozodbek."
      sections={[
        {
          title: "Help and Inquiries",
          body: [
            "For general questions and issues, use the Help form on the website. Your request and our replies may be stored in your support history.",
            <>
              For urgent or serious matters, contact us on{" "}
              <a
                className="text-brand-300 underline"
                href="https://t.me/mukh4mmadov"
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram: @mukh4mmadov
              </a>. Email: {" "}
              <a
                className="text-brand-300 underline"
                href="mailto:omuhammadov467@gmail.com"
              >
                omuhammadov467@gmail.com
              </a>
              .
            </>,
          ],
        },
        {
          title: "Policies and Terms",
          body: [
            <>
              The Privacy Policy explains how personal information is handled:{" "}
              <Link className="text-brand-300 underline" href="/privacy">
                Privacy Policy
              </Link>
              . Read the rules for using the service here:{" "}
              <Link className="text-brand-300 underline" href="/terms">
                Terms of Use
              </Link>
              .
            </>,
          ],
        },
      ]}
    />
  );
}
