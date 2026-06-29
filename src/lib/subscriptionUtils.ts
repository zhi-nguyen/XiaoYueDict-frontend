import { useSubscriptionStore } from '@/store/useSubscriptionStore';

/**
 * Trả về giới hạn thời lượng ghi âm tối đa (giây) theo cấp độ gói đăng ký.
 */
export function getAudioDurationLimit(tier: string | null): number {
  if (!tier) return 15; // Guest
  const normalized = tier.toLowerCase();
  switch (normalized) {
    case 'plus':
      return 60;
    case 'pro':
    case 'premium':
      return 120;
    case 'free':
    default:
      return 30;
  }
}

/**
 * Trả về giới hạn dung lượng file tối đa (bytes) tương ứng với thời lượng gói.
 * Ưu tiên đọc động từ cấu hình limit_min của store (VolumeLimitConfig).
 */
export function getAudioSizeLimitBytes(tier: string | null): number {
  try {
    const usageData = useSubscriptionStore.getState().usageData;
    if (usageData && typeof usageData.limit_min === 'number' && usageData.limit_min > 0) {
      return usageData.limit_min;
    }
  } catch (e) {
    // Bỏ qua lỗi nếu store chưa khởi tạo
  }

  if (!tier) return 250 * 1024; // Guest: 250KB
  const normalized = tier.toLowerCase();
  switch (normalized) {
    case 'plus':
      return 1 * 1024 * 1024; // Plus: 1MB
    case 'pro':
    case 'premium':
      return 2 * 1024 * 1024; // Pro/Premium: 2MB
    case 'free':
    default:
      return 500 * 1024; // Free: 500KB
  }
}
