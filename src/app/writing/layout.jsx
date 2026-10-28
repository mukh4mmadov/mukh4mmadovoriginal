export const metadata = {
  title: 'IELTS Writing Practice',
  description: 'Practise IELTS Academic Writing Task 1 and Task 2 with a timer, word count and AI feedback on the four official criteria.',
  alternates: { canonical: '/writing' },
  openGraph: {
    title: 'IELTS Writing Practice | Mukh4mmadov IELTS',
    description: 'Writing Task 1 and Task 2 practice with AI feedback and an estimated band.',
    url: '/writing',
    images: [{ url: '/og-reading.svg', width: 1200, height: 630, alt: 'IELTS Writing practice' }],
  },
};

export default function WritingLayout({ children }) {
  return children;
}
