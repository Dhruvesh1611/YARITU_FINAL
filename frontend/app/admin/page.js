export const dynamic = 'force-dynamic';

import { auth } from '../api/auth/[...nextauth]/route';
import AdminClient from './AdminClient';
import Link from 'next/link';

export default async function AdminPage() {
  const session = await auth();

  if (!session || (!session.user?.isAdmin && session.user?.role !== 'admin')) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Admin access required</h2>
        <p>You are not signed in as an admin. Please <Link href="/api/auth/signin">sign in</Link> with an admin account to view the admin dashboard.</p>
      </div>
    );
  }

  return <AdminClient />;
}
