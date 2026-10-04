import LegalPage from "@/components/shared/LegalPage";

export const metadata = {
  title: "Privacy Policy",
  description: "How Mukh4mmadov IELTS collects and processes personal data.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "Service Operator and Contact",
    body: [
      "Mukh4mmadov IELTS is operated by Muhammadov Ozodbek. You can contact us through the Help form on the website, by email at omuhammadov467@gmail.com, or on Telegram at @mukh4mmadov.",
      "The project is operated from Uzbekistan. No postal address is provided on this page; please use the electronic contact methods listed above for written inquiries.",
    ],
  },
  {
    title: "Information We Collect",
    body: [
      "When you create an account, we may process account information such as your email address and the name in your profile.",
      "Reading exercises may save your selected answers, results, time spent, progress, and text highlights. Support requests and replies may be stored in your support history, including the subject, message, steps to reproduce an issue, page URL, and our responses.",
      "If you submit a donation screenshot, the image and messages in its separate donation review chat are stored in Supabase. The submitting account and site administrators can view them. Please hide unrelated personal or card details before uploading.",
      "AI conversations are stored in your browser's local storage. If you are signed in, conversations that received a response are also saved to your account in Supabase.",
      "The website may store your display preferences, temporary reading drafts, and choices such as analytics consent in your browser's local storage.",
    ],
  },
  {
    title: "How We Use Information",
    body: [
      "We use this information to manage your account, show reading results and statistics, respond to support requests, maintain security, and identify problems with the website.",
      "Usage analytics are optional. You can turn them on or off in Settings. Analytics events are not sent unless you have enabled analytics. Analytics events do not include question text or your answers.",
    ],
  },
  {
    title: "AI Coach",
    body: [
      "When you use the AI chat, your message, previous messages in the conversation, and relevant passage or question context are sent to an external AI service to generate a response. The website currently uses Gemini. This policy will be updated if the service changes.",
      "AI responses may be inaccurate or incomplete. Do not enter personal or confidential information in the chat.",
    ],
  },
  {
    title: "Service Providers and Data Location",
    body: [
      "The website uses Supabase to store account and reading data and Vercel to host the website. The Supabase project region is listed as Tokyo, Japan (ap-northeast-1). AI requests are currently sent to Gemini. As a result, some information may be processed outside Uzbekistan.",
      "Uzbekistan has requirements concerning the storage and processing of data in other countries. The region listed here describes a service configuration and is not a conclusion about legal compliance; applicable requirements for such transfers should be reviewed separately. Personal data is kept confidential as required by applicable law.",
    ],
  },
  {
    title: "Retention and Deletion Requests",
    body: [
      "Account and reading data remain in the database to provide the service and maintain your results history. Support requests are intended to be retained for 12 months, but automatic deletion has not been implemented, so this period is not currently guaranteed in practice. Contact us to request deletion.",
      "Donation screenshots and donation chat messages have no automatic deletion schedule. Contact us to request deletion.",
      "There is currently no automatic deletion schedule for AI conversations. Copies in your browser may remain in local storage until they are deleted or overwritten; the chat restores only conversations from the last 24 hours.",
      "You can request a copy, correction, or deletion of your information through the Help form, by email, or on Telegram. Requests are reviewed in light of applicable laws and retention obligations. Signing out does not by itself delete your information.",
    ],
  },
  {
    title: "Users Under 18",
    body: [
      "If you are under 18, obtain permission from your parent or legal guardian before creating an account. If you do not have permission, do not create an account or submit personal information.",
    ],
  },
  {
    title: "Changes to This Policy",
    body: [
      "This page may be updated when the service or applicable requirements change. The current version will be published at this URL.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updatedAt="October 3, 2026"
      intro="This page explains how Mukh4mmadov IELTS processes information when you use accounts, reading exercises, support, and AI features."
      sections={sections}
    />
  );
}
