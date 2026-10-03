import LegalPage from "@/components/shared/LegalPage";

export const metadata = {
  title: "Terms of Use",
  description: "Terms for using the Mukh4mmadov IELTS service.",
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    title: "About the Service",
    body: [
      "Mukh4mmadov IELTS is an independent service for reading practice and study. It is not an official service of, or affiliated with, the IELTS organization or Cambridge.",
      "Practice results are provided for educational purposes. They are not official IELTS scores or exam results and do not guarantee future results.",
    ],
  },
  {
    title: "Accounts and Consent",
    body: [
      "Provide accurate information when creating an account and keep your sign-in credentials secure. You are responsible for activity carried out through your account.",
      "If you are under 18, you must obtain permission from your parent or legal guardian before creating an account or submitting personal information.",
    ],
  },
  {
    title: "AI Responses",
    body: [
      "AI responses are generated automatically and may contain errors or inaccuracies. Do not rely on them alone when making important educational decisions.",
      "Do not send confidential, personal, or another person's information to the AI. Conversation content may be sent to an external service to generate a response; see the Privacy Policy for details.",
    ],
  },
  {
    title: "Acceptable Use",
    body: [
      "Use the service for lawful and educational purposes. You must not interfere with the service, attempt unauthorized access, submit malicious software, or violate another person's rights.",
      "Make sure you have the right to submit any text, message, or request you send.",
    ],
  },
  {
    title: "Free Service and Potential Paid Features",
    body: [
      "The service is currently free. Paid features may be added in the future. If they are introduced, pricing and payment terms will be shown before purchase.",
    ],
  },
  {
    title: "Changes to the Service",
    body: [
      "The service, its features, and these Terms may change. Updated Terms will be published on this page. Review the current version before continuing to use the service.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Use the Help form on the website for questions, complaints, or support requests. For urgent matters, contact us at omuhammadov467@gmail.com or on Telegram at @mukh4mmadov.",
      "These Terms are governed by the laws of Uzbekistan. Rights and obligations that cannot be limited by law remain in effect.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updatedAt="October 3, 2026"
      intro="By using Mukh4mmadov IELTS, you agree to follow these Terms. If you do not agree, do not create an account or use the service."
      sections={sections}
    />
  );
}
