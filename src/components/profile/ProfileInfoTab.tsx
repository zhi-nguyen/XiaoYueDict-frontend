'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import ImageCropper from '@/components/profile/ImageCropper';

interface ProfileInfoTabProps {
  user: {
    username: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    bio?: string | null;
    avatar?: string | null;
  };
  tier: string | null;
  onUpdateProfile: (formData: FormData) => Promise<void>;
}

/**
 * Profile information tab: avatar upload, name, bio editing.
 */
export default function ProfileInfoTab({ user, tier, onUpdateProfile }: ProfileInfoTabProps) {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    bio: user.bio || '',
  });
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(user.avatar || null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setSelectedImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedBlob: Blob) => {
    setAvatarBlob(croppedBlob);
    setPreviewAvatar(URL.createObjectURL(croppedBlob));
    setSelectedImageSrc(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('first_name', formData.first_name);
    fd.append('last_name', formData.last_name);
    fd.append('bio', formData.bio);
    if (avatarBlob) {
      fd.append('avatar', avatarBlob, 'avatar.jpg');
    }
    await onUpdateProfile(fd);
    setIsEditingInfo(false);
  };

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative group flex-shrink-0">
            <label htmlFor="avatar-upload" className="cursor-pointer relative w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-4xl font-bold overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/50 transition-all">
              {previewAvatar ? (
                <Image
                  src={previewAvatar}
                  alt="Avatar"
                  width={96}
                  height={96}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              ) : (
                user.first_name && user.last_name
                  ? (user.last_name.charAt(0) + user.first_name.charAt(0)).toUpperCase()
                  : (user.first_name || user.username).substring(0, 2).toUpperCase()
              )}
              {isEditingInfo && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white">photo_camera</span>
                </div>
              )}
            </label>
            {isEditingInfo && (
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 cursor-pointer w-8 h-8 rounded-full bg-primary border-2 border-white flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              </label>
            )}
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
              disabled={!isEditingInfo}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-primary truncate" title={user.first_name ? `${user.last_name || ''} ${user.first_name}`.trim() : user.username}>
              {user.first_name ? `${user.last_name || ''} ${user.first_name}`.trim() : user.username}
            </h2>
            <p className="text-secondary truncate" title={user.email}>{user.email}</p>
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface border border-outline text-xs font-bold text-primary">
              <span className="text-yellow-600 uppercase tracking-wider">{tier || 'Free'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">Họ (Last Name)</label>
              <input
                type="text"
                disabled={!isEditingInfo}
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl focus:border-sage focus:outline-none disabled:opacity-50 text-sm text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">Tên (First Name)</label>
              <input
                type="text"
                disabled={!isEditingInfo}
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl focus:border-sage focus:outline-none disabled:opacity-50 text-sm text-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1">Tiểu sử (Bio)</label>
            <textarea
              disabled={!isEditingInfo}
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl focus:border-sage focus:outline-none disabled:opacity-50 text-sm text-primary min-h-[100px]"
            />
          </div>

          <div className="pt-4">
            {isEditingInfo ? (
              <div className="flex gap-2">
                <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm hover:opacity-90">Lưu thay đổi</button>
                <button type="button" onClick={() => setIsEditingInfo(false)} className="px-6 py-2.5 bg-surface text-primary border border-outline rounded-full font-bold text-sm hover:bg-hover-bg">Hủy</button>
              </div>
            ) : (
              <button type="button" onClick={() => setIsEditingInfo(true)} className="px-6 py-2.5 bg-surface text-primary border border-outline rounded-full font-bold text-sm hover:bg-hover-bg flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Chỉnh sửa hồ sơ
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Cropper Modal */}
      {selectedImageSrc && (
        <ImageCropper
          imageSrc={selectedImageSrc}
          onCropComplete={onCropComplete}
          onCancel={() => setSelectedImageSrc(null)}
        />
      )}
    </>
  );
}
