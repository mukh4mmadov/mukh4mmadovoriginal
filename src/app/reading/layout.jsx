export const metadata = {
  title: 'IELTS Reading Passages',
  description: 'Choose a timed IELTS Reading practice passage and track your saved progress.',
  alternates: { canonical: '/reading' },
  openGraph: {
    title: 'IELTS Reading Passages | Mukh4mmadov IELTS',
    description: 'Choose a timed IELTS Reading practice passage and track your saved progress.',
    url: '/reading',
    images: [{ url: '/og-reading.svg', width: 1200, height: 630, alt: 'IELTS Reading Practice' }],
  },
};

export default function ReadingLayout({ children }) {
  return children;
}
