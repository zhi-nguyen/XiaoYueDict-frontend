"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import ConfirmModal from '@/components/ConfirmModal';
import AlertModal from '@/components/AlertModal';
import PaymentQRModal from '@/components/PaymentQRModal';
import { RegisterResponse } from '@/lib/api/subscriptions';

export default function PricingPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || 'zh';

  const { isAuthenticated } = useAuthStore();
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
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

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
    if (isAuthenticated) {
      fetchSubscription();
    }
  }, [fetchPlans, fetchSubscription, isAuthenticated]);

  const handleAction = (planTier: string) => {
    if (!isAuthenticated) {
      // Redirect to profile page for authentication
      router.push(`/profile`);
      return;
    }

    const tiers = ['Free', 'Plus', 'Pro', 'Premium'];
    const currentIdx = tiers.indexOf(currentTier || 'Free');
    const targetIdx = tiers.indexOf(planTier);

    if (targetIdx > currentIdx) {
      // Nâng cấp (Upgrade Flow - Immediate replacement)
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
      // Hạ cấp (Downgrade Flow)
      if (currentTier === 'Premium') {
        // Premium (Lifetime) downgrade is immediate
        setConfirmConfig({
          isOpen: true,
          title: `Hạ cấp xuống gói ${planTier.toUpperCase()}`,
          message: `Vì tài khoản của bạn đang sử dụng gói PREMIUM Vĩnh viễn (Lifetime), việc hạ cấp xuống gói ${planTier.toUpperCase()} sẽ được thực hiện NGAY LẬP TỨC. Bạn có chắc chắn muốn tiếp tục?`,
          isDestructive: true,
          onConfirm: () => executeRegister(planTier)
        });
      } else {
        // Normal deferred downgrade
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
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Giao dịch thất bại. Vui lòng thử lại sau.';
      setAlertConfig({
        isOpen: true,
        title: 'Thất bại',
        message: errMsg,
        type: 'error'
      });
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentModalConfig({ isOpen: false, paymentData: null });
    // Re-fetch subscription to update local state with the new tier
    fetchSubscription(true);
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
        } catch (err: any) {
          setAlertConfig({
            isOpen: true,
            title: 'Thất bại',
            message: err.response?.data?.error || 'Không thể hủy yêu cầu. Vui lòng thử lại sau.',
            type: 'error'
          });
        }
      }
    });
  };

  // Helper formats VND currency
  const formatPrice = (priceStr: string, planTier: string) => {
    const priceNum = parseFloat(priceStr);
    if (priceNum === 0) return 'Miễn phí';

    let priceWithTax = priceNum;
    if (showVat) {
      priceWithTax = priceNum * 1.1; // 10% VAT
    }

    const formatted = Math.round(priceWithTax).toLocaleString('vi-VN') + ' đ';
    return planTier === 'Premium' ? formatted : `${formatted} / tháng`;
  };

  // Safe subscription tier checker
  const normalizedUserTier = currentTier || 'Free';

  // Feature items per plan
  const getFeatures = (plan: any) => {
    const tierName = plan.tier;
    const limits = plan.limits || {};

    const getLimitVal = (key: string, fallback: number) => {
      return typeof limits[key] === 'number' ? limits[key] : fallback;
    };

    const mbMin = getLimitVal('mb_per_minute', tierName === 'Free' ? 1 : tierName === 'Plus' ? 2 : 5);
    const mbDay = getLimitVal('mb_per_day', tierName === 'Free' ? 10 : tierName === 'Plus' ? 30 : 100);
    const pdfDailyLimit = getLimitVal('pdf_daily_limit', tierName === 'Free' ? 2 : tierName === 'Plus' ? 10 : 50);
    const pdfWordLimit = getLimitVal('pdf_word_limit', tierName === 'Free' ? 10 : tierName === 'Plus' ? 50 : 200);

    const formatMbVal = (val: number) => {
      if (val >= 1024) {
        return `${(val / 1024).toFixed(0)}GB`;
      }
      return `${val}MB`;
    };

    switch (tierName) {
      case 'Free':
        return [
          { name: 'Tra từ Trung-Việt, Anh-Việt cơ bản', available: true },
          { name: `Dung lượng tải file: ${formatMbVal(mbMin)}/phút, ${formatMbVal(mbDay)}/ngày`, available: true },
          { name: 'Tạo tối đa 2 sổ tay học tập', available: true },
          { name: 'Xuất file từ vựng PDF', available: false },
          { name: 'Đặc quyền VIP & Trọn đời vĩnh viễn', available: false },
        ];
      case 'Plus':
        return [
          { name: 'Tra từ song ngữ đầy đủ', available: true },
          { name: `Dung lượng tải file: ${formatMbVal(mbMin)}/phút, ${formatMbVal(mbDay)}/ngày`, available: true },
          { name: 'Không giới hạn số lượng sổ tay', available: true },
          { name: `Xuất tối đa ${pdfDailyLimit} file PDF từ vựng/ngày (tối đa ${pdfWordLimit} từ/file)`, available: true },
          { name: 'Hỗ trợ AI phân tích cơ bản', available: true },
          { name: 'Đặc quyền VIP & Trọn đời vĩnh viễn', available: false },
        ];
      case 'Pro':
        return [
          { name: 'Tra từ song ngữ đầy đủ', available: true },
          { name: `Dung lượng tải file: ${formatMbVal(mbMin)}/phút, ${formatMbVal(mbDay)}/ngày`, available: true },
          { name: `Xuất tối đa ${pdfDailyLimit} file PDF từ vựng/ngày (tối đa ${pdfWordLimit} từ/file)`, available: true },
          { name: 'Full tính năng Luyện Nói & Viết AI', available: true },
          { name: 'Không giới hạn tính năng chấm điểm AI', available: true },
          { name: 'Ưu tiên đường truyền AI tốc độ cao', available: true },
          { name: 'Đặc quyền VIP & Trọn đời vĩnh viễn', available: false },
        ];
      case 'Premium':
        return [
          { name: 'Tra từ song ngữ đầy đủ', available: true },
          { name: `Dung lượng tải file: ${formatMbVal(mbMin)}/phút, ${formatMbVal(mbDay)}/ngày`, available: true },
          { name: `Xuất tối đa ${pdfDailyLimit} file PDF từ vựng/ngày (tối đa ${pdfWordLimit} từ/file)`, available: true },
          { name: 'Full tính năng Luyện Nói & Viết AI', available: true },
          { name: 'Không giới hạn tính năng chấm điểm AI', available: true },
          { name: 'Mua một lần dùng trọn đời vĩnh viễn', available: true },
          { name: 'Không mất chi phí duy trì hàng tháng', available: true },
        ];
      default:
        return [];
    }
  };

  return (
    <>
      <div className="w-full min-h-screen bg-gradient-to-b from-surface to-hover-bg/30 p-4 md:p-8 pb-20 font-lexend">
        <div className="max-w-6xl mx-auto">
          {/* Header section */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-3xl md:text-5xl font-extrabold text-primary mb-4 tracking-tight bg-gradient-to-r from-primary to-sage bg-clip-text text-transparent">
              Nâng cấp gói tài khoản
            </h1>
            <p className="text-secondary text-sm md:text-base leading-relaxed mb-6">
              Mở khóa sức mạnh học tiếng Trung & tiếng Anh toàn diện với hỗ trợ AI tối tân, tăng giới hạn dung lượng và xuất sổ tay thông minh.
            </p>

            {/* VAT Toggle */}
            <div className="inline-flex items-center gap-3 bg-surface border border-outline px-4 py-2 rounded-full shadow-sm">
              <span className={`text-xs font-semibold ${!showVat ? 'text-primary' : 'text-secondary'}`}>Chưa gồm thuế</span>
              <button
                onClick={() => setShowVat(!showVat)}
                className={`relative w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none ${showVat ? 'bg-primary' : 'bg-outline'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${showVat ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </button>
              <span className={`text-xs font-semibold ${showVat ? 'text-primary' : 'text-secondary'}`}>Đã gồm 10% VAT</span>
            </div>
          </div>

          {/* Pricing cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-16">
            {plans.map((plan) => {
              const isCurrent = normalizedUserTier === plan.tier && isActive;
              const isPending = pendingDowngradeTier === plan.tier;
              const features = getFeatures(plan);

              // Determine card styling based on tier
              const isPopular = plan.tier === 'Premium';
              const cardBg = isPopular
                ? 'bg-gradient-to-b from-yellow-50/50 to-amber-50/20 border-yellow-400 shadow-md ring-2 ring-yellow-400/20'
                : 'bg-surface border-outline shadow-sm hover:shadow-md transition-shadow';

              return (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden ${cardBg}`}
                >
                  {isPopular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-[10px] font-bold tracking-widest uppercase py-1 px-4 rounded-bl-xl shadow-sm flex items-center gap-1 z-10">
                      <span className="material-symbols-outlined text-[12px] filled">diamond</span>
                      Vĩnh Viễn
                    </div>
                  )}

                  {/* Header Tier */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`material-symbols-outlined text-2xl ${plan.tier === 'Free' ? 'text-secondary' :
                        plan.tier === 'Plus' ? 'text-sage' :
                          plan.tier === 'Pro' ? 'text-primary' : 'text-yellow-600 filled'
                        }`}>
                        {plan.tier === 'Free' ? 'volunteer_activism' :
                          plan.tier === 'Plus' ? 'stars' :
                            plan.tier === 'Pro' ? 'workspace_premium' : 'diamond'}
                      </span>
                      <h3 className="text-xl font-extrabold text-primary tracking-tight">{plan.tier}</h3>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline mb-2">
                      <span className="text-2xl md:text-3xl font-extrabold text-primary">
                        {formatPrice(plan.price, plan.tier)}
                      </span>
                    </div>

                    <p className="text-secondary text-xs leading-relaxed min-h-[36px]">
                      {plan.description}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-outline my-2"></div>

                  {/* Feature lists */}
                  <ul className="space-y-3 my-4 flex-1">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-xs gap-2">
                        <span className={`material-symbols-outlined shrink-0 text-[18px] ${feature.available ? 'text-emerald-500 font-bold' : 'text-secondary/30'}`}>
                          {feature.available ? 'check_circle' : 'cancel'}
                        </span>
                        <span className={feature.available ? 'text-primary font-medium' : 'text-secondary/50 line-through'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button logic */}
                  <div className="mt-6">
                    {isCurrent ? (
                      <div className="w-full flex flex-col gap-2">
                        <button
                          disabled
                          className="w-full py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-default"
                        >
                          <span className="material-symbols-outlined text-sm filled">check_circle</span>
                          Gói hiện tại của bạn
                        </button>
                        {pendingDowngradeTier && (
                          <div className="text-center p-2 bg-yellow-50 border border-yellow-100 rounded-xl">
                            <p className="text-[10px] text-yellow-800 font-semibold leading-tight">
                              Đã lên lịch hạ cấp xuống gói {pendingDowngradeTier.toUpperCase()}
                            </p>
                            <button
                              onClick={handleCancelDowngrade}
                              className="text-[11px] text-red-500 font-bold hover:underline mt-1 block w-full"
                            >
                              Hủy yêu cầu hạ cấp
                            </button>
                          </div>
                        )}
                      </div>
                    ) : isPending ? (
                      <button
                        disabled
                        className="w-full py-3 bg-yellow-50 border border-yellow-200 text-yellow-700 font-bold text-sm rounded-2xl cursor-default"
                      >
                        Chờ hạ cấp về gói này
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(plan.tier)}
                        className={`w-full py-3 text-sm font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-1 ${plan.tier === 'Premium'
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-sm hover:shadow'
                          : 'bg-primary hover:opacity-90 text-white shadow-sm'
                          }`}
                      >
                        {!isAuthenticated ? (
                          'Đăng nhập để đăng ký'
                        ) : (
                          // Custom label based on hierarchy upgrade vs downgrade
                          ['Free', 'Plus', 'Pro', 'Premium'].indexOf(plan.tier) > ['Free', 'Plus', 'Pro', 'Premium'].indexOf(normalizedUserTier)
                            ? 'Nâng cấp ngay'
                            : 'Hạ cấp gói'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing FAQ or Features Comparison Table */}
          <div className="bg-surface border border-outline rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg md:text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">live_help</span>
              Các câu hỏi thường gặp
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-primary text-sm md:text-base mb-2">Gói Premium (Vĩnh viễn) hoạt động thế nào?</h4>
                <p className="text-secondary text-xs md:text-sm leading-relaxed">
                  Gói Premium là gói Lifetime. Bạn chỉ cần trả phí một lần duy nhất để mở khóa vĩnh viễn tất cả các đặc quyền thuộc gói Pro (gói cao cấp nhất về tính năng học tập & AI) mà không phải trả thêm phí gia hạn mỗi tháng.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-primary text-sm md:text-base mb-2">Chính sách hạ cấp hoạt động ra sao?</h4>
                <p className="text-secondary text-xs md:text-sm leading-relaxed">
                  Khi bạn chọn hạ cấp gói (ví dụ: Pro xuống Plus), hệ thống sẽ lên lịch và giữ nguyên quyền hạn cao cấp hiện tại đến hết thời hạn 30 ngày đã thanh toán. Sau ngày đó, tài khoản sẽ tự động chuyển đổi mà không vi phạm quyền lợi của bạn.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-primary text-sm md:text-base mb-2">Tôi có thể nâng cấp giữa chừng không?</h4>
                <p className="text-secondary text-xs md:text-sm leading-relaxed">
                  Có, bạn có thể nâng cấp bất kỳ lúc nào. Gói cũ sẽ bị hủy bỏ ngay lập tức và gói mới sẽ bắt đầu chu kỳ 30 ngày hoàn toàn mới kể từ ngày nâng cấp.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-primary text-sm md:text-base mb-2">Hệ thống chấp nhận phương thức thanh toán nào?</h4>
                <p className="text-secondary text-xs md:text-sm leading-relaxed">
                  Ở phiên bản hiện tại, hệ thống hỗ trợ thanh toán giả lập (Mock Payment) tự động thành công để đảm bảo trải nghiệm liền mạch và sẽ tích hợp cổng thanh toán thực tế ở cácSprint sau.
                </p>
              </div>
            </div>
          </div>
        </div>
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
    </>
  );
}
