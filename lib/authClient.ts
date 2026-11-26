export interface StoredUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('studymate_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredUser>;
    if (!parsed || !parsed.id || !parsed.email) return null;
    return parsed as StoredUser;
  } catch {
    return null;
  }
}

export function getStoredUserId(): string | null {
  return getStoredUser()?.id ?? null;
}
