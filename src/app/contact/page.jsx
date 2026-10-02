import Link from "next/link";
import LegalPage from "@/components/shared/LegalPage";

export const metadata = {
  title: "Aloqa",
  description: "IELTS Reading Pro yordam va aloqa ma’lumotlari.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <LegalPage
      title="Aloqa"
      updatedAt="2026-yil 2-oktabr"
      intro="IELTS Reading Pro bo‘yicha savol va muammolar uchun quyidagi aloqa yo‘llaridan foydalaning. Loyiha uchun mas’ul shaxs — Muhammadov Ozodbek."
      sections={[
        {
          title: "Yordam va murojaatlar",
          body: [
            "Odatiy savol yoki muammo uchun saytning Yordam shaklidan foydalaning. Yuborgan so‘rovingiz va unga javoblar yordam tarixida saqlanishi mumkin.",
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
              orqali bog‘laning. Elektron pochta:{" "}
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
          title: "Ma’lumot va shartlar",
          body: [
            <>
              Shaxsiy ma’lumotlarga oid ma’lumot uchun{" "}
              <Link className="text-brand-300 underline" href="/privacy">
                Maxfiylik siyosati
              </Link>
              ni, xizmat qoidalari uchun{" "}
              <Link className="text-brand-300 underline" href="/terms">
                Foydalanish shartlari
              </Link>
              ni ko‘ring.
            </>,
          ],
        },
      ]}
    />
  );
}
