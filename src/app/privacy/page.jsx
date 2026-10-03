import LegalPage from "@/components/shared/LegalPage";

export const metadata = {
  title: "Maxfiylik siyosati",
  description: "IELTS Reading Pro shaxsiy ma’lumotlarni qanday qayta ishlashi haqida.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "Xizmat egasi va bog‘lanish",
    body: [
      "IELTS Reading Pro xizmatini Muhammadov Ozodbek yuritadi. Saytdagi Yordam shakli, omuhammadov467@gmail.com elektron pochtasi yoki Telegram’dagi @mukh4mmadov orqali bog‘lanishingiz mumkin.",
      "Loyiha O‘zbekistonda yuritiladi. Bu sahifada pochta manzili ko‘rsatilmagan; yozma murojaatlar uchun yuqoridagi elektron aloqa usullaridan foydalaning.",
    ],
  },
  {
    title: "Yig‘iladigan ma’lumotlar",
    body: [
      "Hisob yaratganingizda elektron pochta manzilingiz va profilingizga kiritgan ismingiz kabi hisob ma’lumotlari qayta ishlanishi mumkin.",
      "O‘qish mashqlari tanlangan javoblar, natijalar, sarflangan vaqt, jarayon va matndagi belgilaringizni saqlashi mumkin. Yordam murojaatlarida mavzu, xabar, muammoni takrorlash qadamlari, sahifa manzili va javoblar yordam tarixida saqlanishi mumkin.",
      "Sun’iy intellekt bilan suhbatlar brauzeringizning local storage xotirasida saqlanadi. Hisobga kirgan bo‘lsangiz, javob olingan suhbatlar Supabase’da hisobingizga ham saqlanadi.",
      "Sayt ko‘rinish sozlamalari, vaqtinchalik o‘qish qoralamalari va tahlilga rozilik kabi tanlovlarni brauzeringizning local storage xotirasida saqlashi mumkin.",
    ],
  },
  {
    title: "Ma’lumotlardan foydalanish",
    body: [
      "Bu ma’lumotlardan hisobingizni boshqarish, o‘qish natijalari va statistikani ko‘rsatish, yordam murojaatlariga javob berish, xavfsizlikni ta’minlash va saytdagi muammolarni aniqlash uchun foydalanamiz.",
      "Foydalanish tahlili ixtiyoriy. Uni Sozlamalar bo‘limida yoqish yoki o‘chirish mumkin. Tahlilga rozilik berilmagan bo‘lsa, tahlil hodisalari yuborilmaydi. Tahlil hodisalariga savol matni yoki javoblar kiritilmaydi.",
    ],
  },
  {
    title: "Sun’iy intellekt yordamchisi",
    body: [
      "Sun’iy intellekt chatidan foydalanganingizda, xabaringiz, suhbatdagi oldingi xabarlar hamda tegishli matn yoki savol konteksti javob yaratish uchun tashqi sun’iy intellekt xizmatiga yuboriladi. Hozirda saytda Gemini ishlatiladi. Xizmat o‘zgarsa, ushbu siyosat yangilanadi.",
      "Sun’iy intellekt javoblari noto‘g‘ri yoki to‘liq bo‘lmasligi mumkin. Chatga shaxsiy yoki maxfiy ma’lumot kiritmang.",
    ],
  },
  {
    title: "Xizmat ko‘rsatuvchilar va ma’lumotlar joylashuvi",
    body: [
      "Sayt hisob va o‘qish ma’lumotlarini saqlash uchun Supabase’dan, saytni joylashtirish uchun Vercel’dan foydalanadi. Supabase loyihasi hududi Tokio, Yaponiya (ap-northeast-1) deb ko‘rsatilgan. Sun’iy intellekt so‘rovlari hozir Gemini’ga yuboriladi. Shu sabab ayrim ma’lumotlar O‘zbekiston tashqarisida qayta ishlanishi mumkin.",
      "O‘zbekistonda ma’lumotlarni boshqa davlatlarda saqlash va qayta ishlashga oid talablar mavjud. Bu yerda ko‘rsatilgan hudud xizmat sozlamasi haqidagi ma’lumot bo‘lib, qonuniy muvofiqlik xulosasi emas; bunday uzatishlarga tegishli talablarni alohida tekshirish kerak. Qonunchilikka muvofiq, shaxsiy ma’lumotlar maxfiy saqlanadi.",
    ],
  },
  {
    title: "Saqlash muddati va o‘chirish so‘rovlari",
    body: [
      "Hisob va o‘qish ma’lumotlari xizmatni ko‘rsatish va natijalar tarixini saqlash uchun bazada turadi. Yordam murojaatlari uchun mo‘ljallangan saqlash muddati 12 oy, ammo avtomatik o‘chirish hozir joriy etilmagan, shuning uchun bu muddat amalda kafolatlanmaydi. O‘chirishni so‘rash uchun bizga murojaat qiling.",
      "Sun’iy intellekt suhbatlari uchun hozir avtomatik o‘chirish jadvali yo‘q. Brauzerdagi nusxalar o‘chirib tashlanmaguncha yoki ustiga yangisi yozilmaguncha local storage’da qolishi mumkin; chat faqat oxirgi 24 soatdagi suhbatlarni tiklaydi.",
      "Ma’lumotlaringiz nusxasi, tuzatilishi yoki o‘chirilishini Yordam shakli, elektron pochta yoki Telegram orqali so‘rashingiz mumkin. So‘rovlar amaldagi qonun va saqlash majburiyatlarini hisobga olgan holda ko‘rib chiqiladi. Hisobdan chiqish ma’lumotlarni o‘z-o‘zidan o‘chirmaydi.",
    ],
  },
  {
    title: "18 yoshga to‘lmagan foydalanuvchilar",
    body: [
      "Agar 18 yoshga to‘lmagan bo‘lsangiz, hisob yaratishdan oldin ota-onangiz yoki qonuniy vakilingiz roziligini oling. Rozilik bo‘lmasa, hisob yaratmang va shaxsiy ma’lumot yubormang.",
    ],
  },
  {
    title: "Siyosatdagi o‘zgarishlar",
    body: [
      "Xizmat yoki tegishli talablar o‘zgarganda ushbu sahifa yangilanishi mumkin. Amaldagi nusxasi shu manzilda e’lon qilinadi.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Maxfiylik siyosati"
      updatedAt="2026-yil 3-oktabr"
      intro="Ushbu sahifada IELTS Reading Pro hisob, o‘qish mashqlari, yordam va sun’iy intellekt xizmatlaridan foydalanilganda ma’lumotlarni qanday qayta ishlashi bayon etiladi."
      sections={sections}
    />
  );
}
