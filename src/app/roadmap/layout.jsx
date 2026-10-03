export const metadata = {
  title: 'Product Roadmap',
  description: 'See the product reliability and feature work planned for Mukh4mmadov IELTS.',
  alternates: { canonical: '/roadmap' },
  openGraph: {
    title: 'Product Roadmap | Mukh4mmadov IELTS',
    description: 'See the product reliability and feature work planned for Mukh4mmadov IELTS.',
    url: '/roadmap',
    images: [{ url: '/og-reading.svg', width: 1200, height: 630, alt: 'Mukh4mmadov IELTS roadmap' }],
  },
};

export default function RoadmapLayout({ children }) {
  return children;
}
