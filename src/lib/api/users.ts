import { apiClient, djangoClient } from '@/lib/apiClient';
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
  // Use djangoClient since it automatically routes to /api/core and is handled by next.config.mjs proxy
  const response = await djangoClient.put('/users/password/change', payload);
  return response.data;
};
