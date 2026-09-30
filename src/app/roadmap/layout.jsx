export const metadata = {
  title: 'Product Roadmap',
  description: 'See the product reliability and feature work planned for Muhammadov IELTS Reading.',
  alternates: { canonical: '/roadmap' },
  openGraph: {
    title: 'Product Roadmap | Muhammadov IELTS Reading',
    description: 'See the product reliability and feature work planned for Muhammadov IELTS Reading.',
    url: '/roadmap',
    images: [{ url: '/og-reading.svg', width: 1200, height: 630, alt: 'Muhammadov IELTS Reading roadmap' }],
  },
};

export default function RoadmapLayout({ children }) {
  return children;
}
