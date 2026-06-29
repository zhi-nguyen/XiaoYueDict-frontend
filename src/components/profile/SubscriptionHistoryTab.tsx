'use client';

import React, { useEffect, useState } from 'react';
import {
  getSubscriptionHistory,
  SubscriptionHistoryItem
} from '@/lib/api/subscriptions';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import ConfirmModal from '@/components/ConfirmModal';
import AlertModal from '@/components/AlertModal';
import PaymentQRModal from '@/components/PaymentQRModal';
import { RegisterResponse } from '@/lib/api/subscriptions';

/**
 * Subscription tab with current status, pricing cards, and transaction history.
 */
export default function SubscriptionHistoryTab() {
  const [subHistory, setSubHistory] = useState<SubscriptionHistoryItem[]>([]);
  const {
    tier: currentTier,
    isActive,
    pendingDowngradeTier,
    endDate,
    plans,
    isLoading,
    fetchPlans,
    fetchSubscription,
    registerPlan,
    cancelPendingDowngrade
  } = useSubscriptionStore();

  const [showVat, setShowVat] = useState(true);

  // Modals state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isDestructive: false,
    onConfirm: () => { }
  });

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [paymentModalConfig, setPaymentModalConfig] = useState<{
    isOpen: boolean;
    paymentData: RegisterResponse['payment'] | null;
  }>({
    isOpen: false,
    paymentData: null,
  });

  useEffect(() => {
    fetchPlans();
    fetchSubscription();
    getSubscriptionHistory()
      .then((data: any) => setSubHistory(Array.isArray(data) ? data : (data?.results || [])))
      .catch(console.error);
  }, [fetchPlans, fetchSubscription]);

  const refreshHistory = () => {
    getSubscriptionHistory()
      .then((data: any) => setSubHistory(Array.isArray(data) ? data : (data?.results || [])))
      .catch(console.error);
  };

  const handleAction = (planTier: string) => {
    const tiers = ['Free', 'Plus', 'Pro', 'Premium'];
    const currentIdx = tiers.indexOf(currentTier || 'Free');
    const targetIdx = tiers.indexOf(planTier);

    if (targetIdx > currentIdx) {
      // Upgrade Flow
      let warningMsg = `Bạn đồng ý nâng cấp lên gói ${planTier.toUpperCase()}? \n\n`;
      if (currentTier && currentTier !== 'Free') {
        warningMsg += `⚠️ CẢNH BÁO BẮT BUỘC: Gói hiện hành (${currentTier.toUpperCase()}) sẽ bị hủy bỏ ngay lập tức. `;
        warningMsg += `Bạn sẽ được tính phí gói mới và chu kỳ sử dụng 30 ngày sẽ được thiết lập lại từ hôm nay. `;
        warningMsg += `Giá trị còn lại của gói cũ sẽ không được hoàn trả hay quy đổi.`;
      } else {
        warningMsg += `Gói của bạn sẽ bắt đầu chu kỳ 30 ngày từ hôm nay (hoặc vĩnh viễn đối với Premium).`;
      }

      setConfirmConfig({
        isOpen: true,
        title: `Nâng cấp gói ${planTier.toUpperCase()}`,
        message: warningMsg,
        isDestructive: currentTier !== 'Free',
        onConfirm: () => executeRegister(planTier)
      });
    } else {
      // Downgrade Flow
      if (currentTier === 'Premium') {
        setConfirmConfig({
          isOpen: true,
          title: `Hạ cấp xuống gói ${planTier.toUpperCase()}`,
          message: `Vì tài khoản của bạn đang sử dụng gói PREMIUM Vĩnh viễn (Lifetime), việc hạ cấp xuống gói ${planTier.toUpperCase()} sẽ được thực hiện NGAY LẬP TỨC. Bạn có chắc chắn muốn tiếp tục?`,
          isDestructive: true,
          onConfirm: () => executeRegister(planTier)
        });
      } else {
        const formattedDate = endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'cuối chu kỳ';
        setConfirmConfig({
          isOpen: true,
          title: `Hạ cấp xuống gói ${planTier.toUpperCase()}`,
          message: `Bạn đang gửi yêu cầu hạ cấp xuống gói ${planTier.toUpperCase()}. Quyền lợi của gói ${currentTier?.toUpperCase()} vẫn sẽ được GIỮ NGUYÊN cho đến hết chu kỳ hiện tại (ngày ${formattedDate}). Sau ngày này, tài khoản mới tự động chuyển về gói ${planTier.toUpperCase()}.`,
          isDestructive: false,
          onConfirm: () => executeRegister(planTier)
        });
      }
    }
  };

  const executeRegister = async (tier: string) => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    try {
      const res = await registerPlan(tier);
      if (res.status === 'payment_pending' && res.payment) {
        // Upgrade requires payment — show QR modal
        setPaymentModalConfig({
          isOpen: true,
          paymentData: res.payment,
        });
      } else if (res.status === 'upgraded' || res.status === 'downgraded_immediately') {
        setAlertConfig({
          isOpen: true,
          title: 'Thành công!',
          message: `Bạn đã đăng ký thành công gói ${tier.toUpperCase()}. Trạng thái tài khoản đã được cập nhật ngay lập tức.`,
          type: 'success'
        });
      } else if (res.status === 'downgrade_scheduled') {
        setAlertConfig({
          isOpen: true,
          title: 'Đã lên lịch hạ cấp',
          message: `Yêu cầu hạ cấp xuống gói ${tier.toUpperCase()} đã được ghi nhận thành công và sẽ có hiệu lực vào cuối chu kỳ hiện tại.`,
          type: 'success'
        });
      }
      refreshHistory();
    } catch (err: any) {
      setAlertConfig({
        isOpen: true,
        title: 'Thất bại',
        message: err.response?.data?.error || err.message || 'Giao dịch thất bại.',
        type: 'error'
      });
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentModalConfig({ isOpen: false, paymentData: null });
    // Re-fetch subscription to update local state with the new tier
    fetchSubscription(true);
    refreshHistory();
    setAlertConfig({
      isOpen: true,
      title: 'Thanh toán thành công!',
      message: 'Gói đăng ký của bạn đã được nâng cấp thành công.',
      type: 'success'
    });
  };

  const handleCancelDowngrade = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hủy yêu cầu hạ cấp',
      message: `Bạn có muốn hủy yêu cầu hạ cấp đang chờ xử lý? Tài khoản của bạn sẽ tiếp tục gia hạn gói ${currentTier?.toUpperCase()} như bình thường.`,
      isDestructive: false,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await cancelPendingDowngrade();
          setAlertConfig({
            isOpen: true,
            title: 'Hủy thành công',
            message: 'Yêu cầu hạ cấp của bạn đã được hủy bỏ thành công.',
            type: 'success'
          });
          refreshHistory();
        } catch (err: any) {
          setAlertConfig({
            isOpen: true,
            title: 'Thất bại',
            message: err.response?.data?.error || 'Không thể hủy yêu cầu.',
            type: 'error'
          });
        }
      }
    });
  };

  const formatPrice = (priceStr: string, planTier: string) => {
    const priceNum = parseFloat(priceStr);
    if (priceNum === 0) return 'Miễn phí';

    let priceWithTax = priceNum;
    if (showVat) {
      priceWithTax = priceNum * 1.1;
    }

    const formatted = Math.round(priceWithTax).toLocaleString('vi-VN') + ' đ';
    return planTier === 'Premium' ? formatted : `${formatted} / tháng`;
  };

  const normalizedUserTier = currentTier || 'Free';

  const getFeatures = (tierName: string) => {
    switch (tierName) {
      case 'Free':
        return [
          { name: 'Tra từ Trung-Việt, Anh-Việt cơ bản', available: true },
          { name: 'Dung lượng tải file: 2MB/phút, 100MB/ngày', available: true },
          { name: 'Tạo tối đa 2 sổ tay học tập', available: true },
          { name: 'Xuất file từ vựng PDF', available: false },
          { name: 'Đặc quyền VIP & Trọn đời vĩnh viễn', available: false },
        ];
      case 'Plus':
        return [
          { name: 'Tra từ song ngữ đầy đủ', available: true },
          { name: 'Dung lượng tải file: 5MB/phút, 300MB/ngày', available: true },
          { name: 'Không giới hạn số lượng sổ tay', available: true },
          { name: 'Xuất tối đa 10 file PDF từ vựng/ngày', available: true },
          { name: 'Hỗ trợ AI phân tích cơ bản', available: true },
          { name: 'Đặc quyền VIP & Trọn đời vĩnh viễn', available: false },
        ];
      case 'Pro':
        return [
          { name: 'Tra từ song ngữ đầy đủ', available: true },
          { name: 'Dung lượng tải file: 20MB/phút, 1GB/ngày', available: true },
          { name: 'Xuất tối đa 50 file PDF từ vựng/ngày', available: true },
          { name: 'Full tính năng Luyện Nói & Viết AI', available: true },
          { name: 'Ưu tiên đường truyền AI tốc độ cao', available: true },
          { name: 'Đặc quyền VIP & Trọn đời vĩnh viễn', available: false },
        ];
      case 'Premium':
        return [
          { name: 'Bao gồm đặc quyền của gói Pro', available: true },
          { name: 'Mua một lần dùng trọn đời vĩnh viễn', available: true },
          { name: 'Không mất chi phí duy trì hàng tháng', available: true },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 font-sans space-y-10">
      {/* 1. Current status card */}
      <div className="bg-hover-bg/30 border border-outline rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
        <h3 className="text-lg font-extrabold text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">stars</span>
          Gói hiện tại của bạn
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-primary uppercase">{normalizedUserTier}</span>
              {isActive && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 tracking-wide uppercase">
                  Đang kích hoạt
                </span>
              )}
            </div>
            <p className="text-secondary text-xs mt-1 leading-relaxed">
              {normalizedUserTier === 'Free' && 'Gói mặc định miễn phí giới hạn dung lượng và dịch vụ.'}
              {normalizedUserTier === 'Plus' && 'Gói Plus mở rộng dung lượng và tính năng PDF.'}
              {normalizedUserTier === 'Pro' && 'Gói Pro cao cấp hỗ trợ toàn bộ tính năng luyện thi & chấm điểm AI.'}
              {normalizedUserTier === 'Premium' && 'Gói Premium VIP Trọn đời, không bao giờ hết hạn.'}
            </p>
            {normalizedUserTier !== 'Free' && (
              <p className="text-secondary text-xs font-semibold mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">event</span>
                Hạn dùng: {endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Vĩnh viễn (Trọn đời)'}
              </p>
            )}
          </div>

          {pendingDowngradeTier && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 max-w-sm">
              <p className="text-xs text-yellow-800 font-bold leading-tight">
                ⚠️ Đã lên lịch hạ cấp xuống gói {pendingDowngradeTier.toUpperCase()}
              </p>
              <p className="text-[10px] text-yellow-700/80 mt-0.5">
                Quyền lợi hiện tại vẫn giữ nguyên cho đến ngày hết hạn của gói.
              </p>
              <button
                onClick={handleCancelDowngrade}
                className="mt-2 text-xs text-red-500 hover:text-red-600 font-extrabold flex items-center gap-0.5 hover:underline"
              >
                <span className="material-symbols-outlined text-sm">cancel</span>
                Hủy yêu cầu hạ cấp
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Choose other plan section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-extrabold text-primary">Thay đổi hoặc đăng ký gói dịch vụ</h3>
            <p className="text-secondary text-xs font-medium">Mở khóa các tính năng nâng cao phù hợp với lộ trình học tập của bạn.</p>
          </div>

          {/* Toggle VAT inside tab */}
          <div className="inline-flex items-center gap-2 bg-hover-bg border border-outline px-3 py-1.5 rounded-full self-start sm:self-center">
            <span className={`text-[11px] font-semibold ${!showVat ? 'text-primary' : 'text-secondary'}`}>Chưa gồm thuế</span>
            <button
              onClick={() => setShowVat(!showVat)}
              className={`relative w-8 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${showVat ? 'bg-primary' : 'bg-outline'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-200 ${showVat ? 'translate-x-3' : 'translate-x-0'}`}></div>
            </button>
            <span className={`text-[11px] font-semibold ${showVat ? 'text-primary' : 'text-secondary'}`}>Gồm 10% VAT</span>
          </div>
        </div>

        {/* Pricing Cards Grid inside profile tab */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {plans.map((plan) => {
            const isCurrent = normalizedUserTier === plan.tier && isActive;
            const isPending = pendingDowngradeTier === plan.tier;
            const features = getFeatures(plan.tier);
            const isPopular = plan.tier === 'Premium';

            const cardBg = isCurrent
              ? 'bg-emerald-50/20 border-emerald-300 ring-2 ring-emerald-500/10'
              : isPopular
                ? 'bg-gradient-to-b from-yellow-50/50 to-amber-50/20 border-yellow-400 shadow-sm'
                : 'bg-surface border-outline shadow-sm hover:shadow transition-shadow';

            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-2xl p-4 border transition-all duration-300 relative overflow-hidden ${cardBg}`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-[9px] font-extrabold tracking-widest uppercase py-0.5 px-3 rounded-bl-lg shadow-sm flex items-center gap-0.5 z-10">
                    <span className="material-symbols-outlined text-[10px] filled">diamond</span>
                    Trọn Đời
                  </div>
                )}

                {/* Card Title & Icon */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`material-symbols-outlined text-xl ${plan.tier === 'Free' ? 'text-secondary' :
                      plan.tier === 'Plus' ? 'text-sage' :
                        plan.tier === 'Pro' ? 'text-primary' : 'text-yellow-600 filled'
                      }`}>
                      {plan.tier === 'Free' ? 'volunteer_activism' :
                        plan.tier === 'Plus' ? 'stars' :
                          plan.tier === 'Pro' ? 'workspace_premium' : 'diamond'}
                    </span>
                    <h4 className="font-extrabold text-primary text-sm sm:text-base tracking-tight">{plan.tier}</h4>
                  </div>

                  {/* Price */}
                  <div className="text-lg font-black text-primary">
                    {formatPrice(plan.price, plan.tier)}
                  </div>
                </div>

                <div className="border-t border-outline my-1.5"></div>

                {/* Features */}
                <ul className="space-y-2 flex-1 my-2">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-[11px] gap-1.5">
                      <span className={`material-symbols-outlined shrink-0 text-[14px] ${feature.available ? 'text-emerald-500 font-bold' : 'text-secondary/30'}`}>
                        {feature.available ? 'check_circle' : 'cancel'}
                      </span>
                      <span className={feature.available ? 'text-primary font-medium' : 'text-secondary/40 line-through'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <div className="mt-4">
                  {isCurrent ? (
                    <div className="w-full flex flex-col gap-1">
                      <button
                        disabled
                        className="w-full py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-default"
                      >
                        <span className="material-symbols-outlined text-xs filled">check_circle</span>
                        Đang dùng
                      </button>
                    </div>
                  ) : isPending ? (
                    <button
                      disabled
                      className="w-full py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 font-bold text-xs rounded-xl cursor-default"
                    >
                      Chờ hạ cấp
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(plan.tier)}
                      className={`w-full py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1 ${plan.tier === 'Premium'
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-sm'
                        : 'bg-primary hover:opacity-90 text-white shadow-sm'
                        }`}
                    >
                      {['Free', 'Plus', 'Pro', 'Premium'].indexOf(plan.tier) > ['Free', 'Plus', 'Pro', 'Premium'].indexOf(normalizedUserTier)
                        ? 'Nâng cấp'
                        : 'Hạ cấp'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Transaction Logs Table */}
      <div>
        <h3 className="text-lg font-extrabold text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history</span>
          Lịch sử giao dịch & Thay đổi gói
        </h3>

        {subHistory.length === 0 ? (
          <div className="text-center py-8 bg-surface rounded-xl border border-outline border-dashed">
            <span className="material-symbols-outlined text-3xl text-secondary/50 mb-1.5">history</span>
            <p className="text-secondary text-xs font-semibold">Chưa có lịch sử giao dịch nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-outline rounded-2xl">
            <table className="w-full text-left text-xs text-primary">
              <thead className="bg-surface text-secondary font-bold uppercase border-b border-outline">
                <tr>
                  <th className="px-5 py-3.5">Ngày thực hiện</th>
                  <th className="px-5 py-3.5">Hành động</th>
                  <th className="px-5 py-3.5">Gói đăng ký</th>
                  <th className="px-5 py-3.5">Ghi chú chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline">
                {subHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-hover-bg transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">{new Date(item.changed_at).toLocaleString('vi-VN')}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${item.action === 'UPGRADE' ? 'bg-green-50 text-green-700 border border-green-200' :
                        item.action === 'DOWNGRADE' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                          item.action === 'RENEW' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {item.action === 'UPGRADE' ? 'Nâng cấp' :
                          item.action === 'DOWNGRADE' ? 'Hạ cấp' :
                            item.action === 'RENEW' ? 'Gia hạn' : 'Hủy gói'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-primary">{item.tier}</td>
                    <td className="px-5 py-3.5 text-secondary">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDestructive={confirmConfig.isDestructive}
        confirmText="Đồng ý thanh toán"
        cancelText="Hủy bỏ"
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <PaymentQRModal
        isOpen={paymentModalConfig.isOpen}
        paymentData={paymentModalConfig.paymentData ?? null}
        onClose={() => setPaymentModalConfig({ isOpen: false, paymentData: null })}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
