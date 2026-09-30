export const metadata = {
  title: 'Product Changelog',
  description: 'See the latest updates and fixes to Muhammadov IELTS Reading.',
  alternates: { canonical: '/changelog' },
  openGraph: {
    title: 'Product Changelog | Muhammadov IELTS Reading',
    description: 'See the latest updates and fixes to Muhammadov IELTS Reading.',
    url: '/changelog',
    images: [{ url: '/og-reading.svg', width: 1200, height: 630, alt: 'Muhammadov IELTS Reading updates' }],
  },
};

export default function ChangelogLayout({ children }) {
  return children;
}
