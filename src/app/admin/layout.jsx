import AdminLayout from '@/components/admin/AdminLayout';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Manage users, support, feedback, and platform activity.',
  alternates: { canonical: '/admin' },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Admin Dashboard | Muhammadov IELTS Reading',
    description: 'Manage users, support, feedback, and platform activity.',
  },
};

export default function Layout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}
