import { supabase } from './client';

export async function isAdmin(userId) {
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

export async function requireAdmin(userId) {
  const adminCheck = await isAdmin(userId);
  if (!adminCheck) {
    throw new Error('Unauthorized: Admin access required');
  }
}
