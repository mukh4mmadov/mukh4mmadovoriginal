import LegalPage from "@/components/shared/LegalPage";

export const metadata = {
  title: "Maxfiylik siyosati",
  description: "IELTS Reading Pro shaxsiy ma’lumotlardan qanday foydalanishi haqida.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "Mas’ul shaxs va aloqa",
    body: [
      "IELTS Reading Pro loyihasi uchun mas’ul shaxs — Muhammadov Ozodbek. Murojaatni saytdagi Yordam shakli orqali, omuhammadov467@gmail.com manziliga yoki Telegram’dagi @mukh4mmadov hisobiga yuborishingiz mumkin.",
      "Loyiha O‘zbekistondan yuritiladi. Ushbu sahifada pochta manzili ko‘rsatilmagan; yozma murojaatlar uchun yuqoridagi elektron aloqa yo‘llaridan foydalaning.",
    ],
  },
  {
    title: "Qanday ma’lumotlarni olamiz",
    body: [
      "Hisob ochilganda elektron pochta manzili va profilga kiritilgan ism kabi hisob ma’lumotlari qayta ishlanishi mumkin.",
      "O‘qish mashqlarida tanlangan javoblar, natijalar, sarflangan vaqt, o‘qish jarayoni va ajratib belgilangan matnlar saqlanishi mumkin. Yordam shaklidan yuborilgan mavzu, murojaat matni, muammoni takrorlash qadamlari, sahifa manzili va javoblar ham yordam tarixida saqlanadi.",
      "Sayt ayrim ko‘rinish sozlamalari, vaqtinchalik mashq qoralamalari va tahlil roziligi kabi tanlovlarni qurilmangizdagi brauzer xotirasida saqlashi mumkin.",
    ],
  },
  {
    title: "Ma’lumotlardan foydalanish",
    body: [
      "Ma’lumotlar hisobingizni yuritish, o‘qish natijalari va statistikasini ko‘rsatish, yordam so‘rovlariga xizmat ko‘rsatish, xavfsizlikni saqlash va saytdagi muammolarni bartaraf etish uchun ishlatiladi.",
      "Foydalanish tahlili ixtiyoriy. Uni Sozlamalar sahifasida yoqish yoki o‘chirish mumkin. Tahlilga rozilik berilmasa, tahlil hodisalari yuborilmaydi. Tahlil hodisalariga savol matni va javoblar kiritilmasligi ko‘zda tutilgan.",
    ],
  },
  {
    title: "Sun’iy intellekt xizmati",
    body: [
      "Sun’iy intellekt bilan suhbatdan foydalanganingizda, yozgan xabaringiz, suhbatdagi oldingi xabarlar va shu mashqqa tegishli matn yoki savol konteksti javob yaratish uchun tashqi sun’iy intellekt xizmatiga yuboriladi. Hozir sayt Gemini xizmatidan foydalanadi. Xizmat keyinchalik o‘zgarsa, ushbu siyosat ham yangilanadi.",
      "Sun’iy intellekt javoblari xato yoki to‘liq bo‘lmasligi mumkin. Shaxsiy yoki maxfiy ma’lumotlarni suhbatga kiritmang.",
    ],
  },
  {
    title: "Xizmat ko‘rsatuvchilar va saqlash hududi",
    body: [
      "Sayt Supabase’dan hisob va o‘qish ma’lumotlarini saqlash uchun, Vercel’dan esa saytni joylashtirish uchun foydalanadi. Supabase boshqaruv sahifasidagi loyiha hududi Yaponiya, Tokio (ap-northeast-1) deb ko‘rsatilgan. Sun’iy intellekt so‘rovlari hozir Gemini xizmatiga yuboriladi. Shu sabab ayrim ma’lumotlar O‘zbekiston tashqarisida qayta ishlanishi mumkin.",
      "O‘zbekiston qonunchiligida ma’lumotlarni boshqa davlatda saqlash va qayta ishlashga doir talablar mavjud. Ushbu sahifadagi hudud haqidagi ma’lumot xizmatning hozirgi sozlamasini bildiradi; bunday uzatishga taalluqli talablar alohida tekshirilishi lozim. Qonun talab qilgan holatlar bundan mustasno, shaxsiy ma’lumotlar maxfiy saqlanadi.",
    ],
  },
  {
    title: "Saqlash muddati va o‘chirish so‘rovlari",
    body: [
      "Hisob va o‘qish ma’lumotlari xizmatni ko‘rsatish va natijalar tarixini saqlash uchun bazada turadi. Yordam murojaatlari uchun mo‘ljallangan saqlash muddati 12 oy; hozir avtomatik o‘chirish yo‘lga qo‘yilmagan, shuning uchun bu muddat amalda kafolatlanmaydi. O‘chirishni so‘rash uchun bizga murojaat qiling.",
      "Ma’lumotlaringizdan nusxa olish, ularni tuzatish yoki o‘chirish haqida Yordam shakli, elektron pochta yoki Telegram orqali murojaat qilishingiz mumkin. So‘rov amaldagi qonunchilik va saqlash majburiyatlariga muvofiq ko‘rib chiqiladi. Hisobdan chiqishning o‘zi ma’lumotlarni o‘chirish so‘rovi hisoblanmaydi.",
    ],
  },
  {
    title: "Voyaga yetmaganlar",
    body: [
      "18 yoshga to‘lmagan foydalanuvchi hisob ochishdan oldin ota-onasi yoki qonuniy vakilining roziligini olishi kerak. Qonuniy vakil rozilik bermagan bo‘lsa, hisob ochmang va shaxsiy ma’lumot yubormang.",
    ],
  },
  {
    title: "Siyosatdagi o‘zgarishlar",
    body: [
      "Xizmat yoki qonuniy talablar o‘zgarganda ushbu sahifa yangilanishi mumkin. Amaldagi nusxani shu manzildan ko‘rishingiz mumkin.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Maxfiylik siyosati"
      updatedAt="2026-yil 2-oktabr"
      intro="Ushbu sahifada IELTS Reading Pro hisob, o‘qish, yordam va sun’iy intellekt xizmatlaridan foydalanish paytida qanday ma’lumotlarni qayta ishlashi bayon etiladi."
      sections={sections}
    />
  );
}
