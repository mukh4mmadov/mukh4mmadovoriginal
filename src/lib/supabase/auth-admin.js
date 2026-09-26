import { authService } from './auth';

export async function isAdmin(userId) {
  const profile = await authService.getUserProfile(userId);
  return Boolean(profile?.is_admin);
}

export async function requireAdmin(userId) {
  const adminCheck = await isAdmin(userId);
  if (!adminCheck) {
    throw new Error('Unauthorized: Admin access required');
  }
}
