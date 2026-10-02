import LegalPage from "@/components/shared/LegalPage";

export const metadata = {
  title: "Foydalanish shartlari",
  description: "IELTS Reading Pro xizmatidan foydalanish shartlari.",
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    title: "Xizmat haqida",
    body: [
      "IELTS Reading Pro mustaqil o‘qish va mashq qilish uchun yaratilgan xizmatdir. U IELTS tashkiloti yoki Cambridge bilan bog‘liq rasmiy xizmat emas.",
      "Mashq natijalari o‘quv maqsadida ko‘rsatiladi. Ular rasmiy IELTS bahosi, imtihon natijasi yoki kelajakdagi natijaning kafolati hisoblanmaydi.",
    ],
  },
  {
    title: "Hisob va rozilik",
    body: [
      "Hisob ochishda to‘g‘ri ma’lumot bering va hisobga kirish vositalarini ehtiyot qiling. Hisobingiz orqali amalga oshirilgan harakatlar uchun javobgarlik sizda bo‘ladi.",
      "18 yoshga to‘lmagan bo‘lsangiz, hisob ochish va shaxsiy ma’lumotlaringizni qayta ishlashdan oldin ota-onangiz yoki qonuniy vakilingiz roziligini olishingiz kerak.",
    ],
  },
  {
    title: "Sun’iy intellekt javoblari",
    body: [
      "Sun’iy intellekt javoblari avtomatik yaratiladi; ularda xato yoki noaniqlik bo‘lishi mumkin. Muhim ta’limiy qarorlarni faqat shu javoblarga tayanib qabul qilmang.",
      "Sun’iy intellektga maxfiy, shaxsiy yoki boshqa birovga tegishli ma’lumotlarni yubormang. Bunday suhbat mazmuni javob tayyorlash uchun tashqi xizmatga uzatiladi; tafsilotlar Maxfiylik siyosatida berilgan.",
    ],
  },
  {
    title: "Maqbul foydalanish",
    body: [
      "Xizmatdan qonuniy va ta’limiy maqsadlarda foydalaning. Xizmat ishiga xalaqit berish, ruxsatsiz kirishga urinish, zararli dastur yuborish yoki boshqalarning huquqlarini buzish mumkin emas.",
      "O‘zingiz yuborgan matnlar va murojaatlarni yuborishga huquqingiz borligiga ishonch hosil qiling.",
    ],
  },
  {
    title: "Bepul va kelajakdagi pullik imkoniyatlar",
    body: [
      "Hozirgi xizmat bepul. Kelajakda pullik imkoniyatlar qo‘shilishi mumkin. Bunday imkoniyat uchun narx va to‘lov shartlari xarid qilishdan oldin alohida ko‘rsatiladi.",
    ],
  },
  {
    title: "Xizmatdagi o‘zgarishlar",
    body: [
      "Xizmat, imkoniyatlar va ushbu shartlar o‘zgarishi mumkin. Yangilangan shartlar shu sahifada e’lon qilinadi. Xizmatdan foydalanishni davom ettirishdan oldin yangilangan matnni ko‘rib chiqing.",
    ],
  },
  {
    title: "Aloqa",
    body: [
      "Savol, shikoyat yoki yordam so‘rovi uchun saytdagi Yordam shaklidan foydalaning. Shoshilinch aloqa uchun omuhammadov467@gmail.com elektron pochta manziliga yoki Telegram’dagi @mukh4mmadov hisobiga yozing.",
      "Ushbu shartlarga O‘zbekiston qonunchiligi tatbiq etiladi. Qonun bilan cheklab bo‘lmaydigan huquq va majburiyatlar o‘z kuchida qoladi.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Foydalanish shartlari"
      updatedAt="2026-yil 2-oktabr"
      intro="IELTS Reading Pro’dan foydalanish orqali ushbu shartlarga amal qilishga rozilik bildirasiz. Rozi bo‘lmasangiz, hisob ochmang yoki xizmatdan foydalanmang."
      sections={sections}
    />
  );
}
