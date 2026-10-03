import Link from "next/link";
import LegalPage from "@/components/shared/LegalPage";

export const metadata = {
  title: "Aloqa",
  description: "IELTS Reading Pro bo‘yicha yordam va aloqa ma’lumotlari.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <LegalPage
      title="Aloqa"
      updatedAt="2026-yil 3-oktabr"
      intro="IELTS Reading Pro bo‘yicha savol yoki muammolar yuzasidan quyidagi aloqa usullaridan foydalaning. Xizmatni Muhammadov Ozodbek yuritadi."
      sections={[
        {
          title: "Yordam va murojaatlar",
          body: [
            "Oddiy savol va muammolar uchun saytdagi Yordam shaklidan foydalaning. Murojaatingiz va unga berilgan javoblar yordam tarixida saqlanishi mumkin.",
            <>
              Shoshilinch yoki jiddiy masalalarda{" "}
              <a
                className="text-brand-300 underline"
                href="https://t.me/mukh4mmadov"
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram: @mukh4mmadov
              </a>{" "}
              . Elektron pochta:{" "}
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
          title: "Siyosat va shartlar",
          body: [
            <>
              Shaxsiy ma’lumotlar haqida Maxfiylik siyosatida ma’lumot berilgan:{" "}
              <Link className="text-brand-300 underline" href="/privacy">
                Maxfiylik siyosati
              </Link>
              . Xizmat qoidalari bilan bu yerda tanishing:{" "}
              <Link className="text-brand-300 underline" href="/terms">
                Foydalanish shartlari
              </Link>
              .
            </>,
          ],
        },
      ]}
    />
  );
}
