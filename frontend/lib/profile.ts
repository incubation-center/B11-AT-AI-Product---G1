import { protectedFetch } from './auth';

export type UserProfile = {
  id: string;
  email: string;
  emailVerified: boolean;
  profile: {
    fullName: string;
    tenantId: string | null;
  };
};

export async function getMyProfile() {
  return protectedFetch<UserProfile>('/me');
}

export async function updateProfile(fullName: string) {
  return protectedFetch<UserProfile>('/me', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ full_name: fullName }),
  });
}

export async function deactivateAccount() {
  return protectedFetch<{ message: string }>('/me/deactivate', {
    method: 'PATCH',
  });
}
