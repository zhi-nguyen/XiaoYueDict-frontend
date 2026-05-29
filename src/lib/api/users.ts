import { apiClient } from '@/lib/apiClient';

export interface UserProfilePayload {
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar?: string;
}

export interface ChangePasswordPayload {
  old_password?: string;
  new_password?: string;
}

export const updateUserProfile = async (payload: FormData) => {
  // Use apiClient to ensure the Authorization token interceptor is applied
  const response = await apiClient.patch('/users/profile', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
  return response.data;
};

export const changeUserPassword = async (payload: ChangePasswordPayload) => {
  // Using apiClient directly for PUT requires matching Next.js rewriting without causing 308 drop
  // We call apiClient (which has Next.js BFF base URL) but use the path matching Next.js rewrite rule.
  const response = await apiClient.put('/users/password/change', payload);
  return response.data;
};
