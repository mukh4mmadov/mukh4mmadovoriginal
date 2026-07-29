import { supabase } from './client';

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error) return false;
    return data?.is_admin || false;
  } catch {
    return false;
  }
}

export async function requireAdmin(userId: string): Promise<void> {
  const adminCheck = await isAdmin(userId);
  if (!adminCheck) {
    throw new Error('Unauthorized: Admin access required');
  }
}
