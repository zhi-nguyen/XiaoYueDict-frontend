export const getGuestId = (): string | null => {
  if (typeof window === 'undefined') return null;
  let gid = localStorage.getItem('guest_id');
  if (!gid) {
    gid = `guest_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('guest_id', gid);
  }
  return gid;
};

/** Remove guest_id from localStorage upon successful login. */
export const clearGuestId = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('guest_id');
};
