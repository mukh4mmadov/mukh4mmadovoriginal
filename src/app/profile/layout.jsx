export const metadata = {
  title: 'Your Profile',
  description: 'Manage your IELTS profile, personal information, and account settings.',
  alternates: { canonical: '/profile' },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Your Profile | Mukh4mmadov IELTS',
    description: 'Manage your IELTS profile, personal information, and account settings.',
    url: '/profile',
    images: [{ url: '/og-reading.svg', width: 1200, height: 630, alt: 'Mukh4mmadov IELTS profile' }],
  },
};
export default function ProfileLayout({ children }) { return children; }
