export const metadata = {
  title: 'Home',
  description: 'Mukh4mmadov IELTS - Complete IELTS practice with reading passages, AI coaching, and progress tracking.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Mukh4mmadov IELTS | Complete IELTS Practice',
    description: 'Prepare for IELTS with focused reading practice, AI coaching, and detailed progress tracking.',
    url: '/',
    images: [{ url: '/og-reading.svg', width: 1200, height: 630, alt: 'IELTS Reading Practice' }],
  },
};

export default function HomeLayout({ children }) {
  return children;
}
