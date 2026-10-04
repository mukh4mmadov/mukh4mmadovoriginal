export const metadata = {
  title: 'Account Settings',
  description: 'Configure your IELTS app preferences, notifications, and account options.',
  alternates: { canonical: '/settings' },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Account Settings | Mukh4mmadov IELTS',
    description: 'Configure your IELTS app preferences, notifications, and account options.',
    url: '/settings',
    images: [{ url: '/og-reading.svg', width: 1200, height: 630, alt: 'Mukh4mmadov IELTS settings' }],
  },
};
export default function SettingsLayout({ children }) { return children; }
