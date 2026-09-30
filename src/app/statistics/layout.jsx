export const metadata = {
  title: 'Reading Statistics',
  description: 'Review your IELTS Reading practice, scores, and study progress.',
  alternates: { canonical: '/statistics' },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Reading Statistics | Muhammadov IELTS Reading',
    description: 'Review your IELTS Reading practice, scores, and study progress.',
    url: '/statistics',
    images: [{ url: '/og-reading.svg', width: 1200, height: 630, alt: 'Muhammadov IELTS Reading statistics' }],
  },
};

export default function StatisticsLayout({ children }) {
  return children;
}
