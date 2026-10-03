export const metadata = {
  title: 'Product Changelog',
  description: 'See the latest updates and fixes to Mukh4mmadov IELTS.',
  alternates: { canonical: '/changelog' },
  openGraph: {
    title: 'Product Changelog | Mukh4mmadov IELTS',
    description: 'See the latest updates and fixes to Mukh4mmadov IELTS.',
    url: '/changelog',
    images: [{ url: '/og-reading.svg', width: 1200, height: 630, alt: 'Mukh4mmadov IELTS updates' }],
  },
};

export default function ChangelogLayout({ children }) {
  return children;
}
