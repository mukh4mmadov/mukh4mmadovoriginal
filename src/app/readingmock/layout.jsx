export const metadata = {
  title: 'IELTS Reading Full Mock Test',
  description: 'Take a full IELTS Academic Reading mock: three passages, 40 questions and 60 minutes, with an approximate band estimate and full answer review.',
  alternates: { canonical: '/readingmock' },
  openGraph: {
    title: 'IELTS Reading Full Mock Test | Mukh4mmadov IELTS',
    description: 'Three passages, 40 questions and 60 minutes, with an approximate band estimate and full answer review.',
    url: '/readingmock',
    images: [{ url: '/og-reading.svg', width: 1200, height: 630, alt: 'IELTS Reading full mock test' }],
  },
};

export default function ReadingMockLayout({ children }) {
  return children;
}
