"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCoinStore } from '@/store/useCoinStore';
import { useAuthStore } from '@/store/useAuthStore';
import {
  getShopItems,
  purchaseShopItem,
  initiateCoinPurchase,
  ShopItem
} from '@/lib/api/coins';
import { apiClient } from '@/lib/apiClient';
import AlertModal from '@/components/AlertModal';

// --- Custom Confetti Effect ---
interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const ConfettiCanvas = ({ active }: { active: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const colors = ['#FFC107', '#FF5722', '#E91E63', '#9C27B0', '#3F51B5', '#00BCD4', '#4CAF50', '#8BC34A'];

    const createParticle = (): Particle => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 50,
      y: canvas.height / 2 + (Math.random() - 0.5) * 50,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * 15,
      speedY: -Math.random() * 15 - 5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    });

    if (active) {
      // Spawn initial burst
      for (let i = 0; i < 150; i++) {
        particles.current.push(createParticle());
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((p, idx) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.3; // gravity
        p.speedX *= 0.98; // resistance
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.01;

        if (p.opacity <= 0) {
          particles.current.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (particles.current.length > 0) {
        animationFrameId.current = requestAnimationFrame(render);
      }
    };

    if (active) {
      render();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      particles.current = [];
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};

export default function ShopPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as 'zh' | 'en') || 'zh';

  const { wallets, fetchWalletBalances, shopItems: items, isLoadingShopItems: isLoadingItems, fetchShopItems } = useCoinStore();
  const { isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'utility' | 'elite' | 'legendary'>('utility');
  const [isBuyingItemId, setIsBuyingItemId] = useState<string | null>(null);

  // Confetti trigger
  const [confettiActive, setConfettiActive] = useState(false);

  // Dialog / Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'free' | 'paid' | 'shop'>('free');

  // Custom states for Split Spend warning
  const [showSplitWarning, setShowSplitWarning] = useState(false);
  const [splitDetails, setSplitDetails] = useState<{ freeDeduct: number; paidDeduct: number } | null>(null);

  // Top Up Modal states
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(50);
  const [qrData, setQrData] = useState<any>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isCustomAmount, setIsCustomAmount] = useState(false);

  // Purchase success Modal
  const [successItem, setSuccessItem] = useState<any>(null);
  const [isEquipping, setIsEquipping] = useState(false);

  // AlertModal state
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showAlert = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setAlertState({
      isOpen: true,
      type,
      title,
      message
    });
  };

  // Localization labels
  const coinLabel = lang === 'zh' ? 'Linh Thạch' : 'Coin';
  const paidCoinLabel = lang === 'zh' ? 'Linh Thạch Paid' : 'Coin Paid';
  const shopQuotaLabel = lang === 'zh' ? 'Thần thạch' : 'Đá quý';

  useEffect(() => {
    // Cho phép Guest xem catalog cửa hàng, chỉ fetch ví khi đã đăng nhập
    fetchShopItems();
    if (isAuthenticated) {
      fetchWalletBalances(true);
    }
  }, [isAuthenticated, lang]);

  const getFilteredItems = () => {
    if (activeTab === 'utility') {
      return items.filter(item => item.rarity === 'common');
    }
    if (activeTab === 'elite') {
      return items.filter(item => item.rarity === 'rare' || item.rarity === 'epic');
    }
    if (activeTab === 'legendary') {
      return items.filter(item => item.rarity === 'legendary');
    }
    return [];
  };

  // Trích xuất số dư ví hiện tại theo ngôn ngữ
  const balance = wallets[lang] || { free: 0, paid: 0, shop: 0, total: 0 };

  // Nhấn mua vật phẩm
  const handleBuyClick = (item: ShopItem, defaultMethod?: 'free' | 'paid' | 'shop') => {
    // Chặn Guest: yêu cầu đăng nhập để mua
    if (!isAuthenticated) {
      showAlert('info', 'Yêu cầu đăng nhập', 'Bạn cần đăng nhập để mua vật phẩm trong cửa hàng.');
      return;
    }
    setConfirmItem(item);

    // Đặt method mặc định dựa theo Tab và rarity
    let method: 'free' | 'paid' | 'shop' = defaultMethod || 'free';
    if (item.rarity === 'legendary') {
      method = 'shop';
    } else if (item.rarity === 'common') {
      method = 'free';
    }
    setSelectedMethod(method);

    // Kiểm tra cơ chế Split Spend (Utility & Elite mua bằng Free)
    if (method === 'free') {
      const price = item.price_free;
      if (balance.free < price) {
        const missing = price - balance.free;
        if (balance.free + balance.paid >= price) {
          // Kích hoạt Modal UX Split Spend
          setSplitDetails({
            freeDeduct: balance.free,
            paidDeduct: missing
          });
          setShowSplitWarning(true);
          return;
        } else {
          // Thiếu hoàn toàn
          showAlert('error', 'Không đủ số dư', `Bạn không đủ số dư. Cần ${price} ${coinLabel} (Hiện có: Free=${balance.free}, Paid=${balance.paid})`);
          return;
        }
      }
    }

    // Nếu không vướng Split Spend hoặc dùng phương thức khác, mở xác nhận thông thường
    setShowConfirmModal(true);
  };

  // Xác nhận Mua (thực thi API)
  const executePurchase = async (method: 'free' | 'paid' | 'shop') => {
    if (!confirmItem) return;

    // Double-click prevention (disabled loading)
    setIsBuyingItemId(confirmItem.id);
    setShowConfirmModal(false);
    setShowSplitWarning(false);

    try {
      const res = await purchaseShopItem(confirmItem.id, lang, method);

      // Kích hoạt pháo hoa confetti
      setConfettiActive(false);
      setTimeout(() => setConfettiActive(true), 50);

      // Cập nhật lại số dư ví trong Zustand store
      useCoinStore.getState().setWallets(res.wallet_balances);

      // Làm mới danh sách vật phẩm trong cửa hàng để cập nhật trạng thái sở hữu
      fetchShopItems();

      // Lưu lại item mua thành công để hiển thị popup chúc mừng
      setSuccessItem(res.inventory);

    } catch (err: any) {
      console.error(err);
      showAlert('error', 'Giao dịch thất bại', err.response?.data?.error || 'Giao dịch thất bại. Vui lòng kiểm tra lại số dư.');
    } finally {
      setIsBuyingItemId(null);
      setConfirmItem(null);
      setSplitDetails(null);
    }
  };

  // Trang bị ngay vật phẩm vừa mua
  const handleEquipNow = async () => {
    if (!successItem) return;
    setIsEquipping(true);
    try {
      await apiClient.post(`/gamification/inventory/${successItem.id}/equip/`);
      showAlert('success', 'Trang bị thành công', `Đã trang bị thành công: ${successItem.reward_item.name}`);

      // Reload lại route/sidebar để hiển thị thay đổi avatar/danh hiệu
      router.refresh();
      setSuccessItem(null);
    } catch (err: any) {
      console.error(err);
      showAlert('error', 'Lỗi trang bị', 'Không thể trang bị vật phẩm lúc này.');
    } finally {
      setIsEquipping(false);
    }
  };

  // Tạo QR thanh toán nạp tiền
  const handleGenerateQR = async () => {
    setIsGeneratingQR(true);
    try {
      const data = await initiateCoinPurchase(lang, topUpAmount);
      setQrData(data);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Lỗi thanh toán', 'Không thể khởi tạo thanh toán. Thử lại sau.');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Đóng modal topup
  const closeTopUp = () => {
    setShowTopUpModal(false);
    setQrData(null);
    setIsCustomAmount(false);
    setTopUpAmount(50);
    fetchWalletBalances(true); // reload balances phòng khi user vừa nạp thành công
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <ConfettiCanvas active={confettiActive} />

      {/* --- HEADER TIỀN TỆ --- */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface border border-outline p-6 rounded-3xl shadow-sm gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              Cửa Hàng XiaoYue
              <button
                onClick={() => { fetchShopItems(); fetchWalletBalances(true); }}
                className="text-secondary-text hover:text-foreground transition-colors p-1 flex items-center justify-center rounded-lg hover:bg-hover-bg/50"
                title="Làm mới cửa hàng"
              >
                <span className={`material-symbols-outlined text-lg ${isLoadingItems ? 'animate-spin' : ''}`}>refresh</span>
              </button>
            </h1>
            <p className="text-sm text-secondary-text mt-1">
              Trang bị khung avatar và danh hiệu độc quyền để khẳng định bản thân!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {/* Hạn ngạch Dịch vụ (Free / Paid) */}
            <div className="flex flex-col bg-hover-bg/40 px-5 py-3 rounded-2xl border border-outline">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-text mb-2">Ví Dịch Vụ</span>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-500 text-lg">monetization_on</span>
                  <span className="font-semibold text-sm">{balance.free} Free</span>
                </div>
                <div className="border-l border-outline h-5 my-auto"></div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sky-500 text-lg">stars</span>
                  <span className="font-semibold text-sm">{balance.paid} Paid</span>
                </div>
              </div>
            </div>

            {/* Hạn ngạch Cửa hàng */}
            <div className="flex flex-col bg-primary/10 px-5 py-3 rounded-2xl border border-primary/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">Hạn Ngạch Cửa Hàng</span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-500 filled">diamond</span>
                <span className="font-bold text-base text-primary">{balance.shop} {shopQuotaLabel}</span>
              </div>
            </div>

            {/* Nút nạp tiền - Ẩn khi có modal mở để tránh đè z-index layout */}
            {!(showTopUpModal || showConfirmModal || showSplitWarning || successItem) ? (
              <button
                onClick={() => setShowTopUpModal(true)}
                className="h-12 bg-primary hover:bg-primary/90 text-white font-bold px-6 rounded-full flex items-center gap-2 shadow-md hover:shadow-lg transition-all animate-in fade-in duration-200"
              >
                <span className="material-symbols-outlined text-lg">add_card</span>
                Nạp Thêm
              </button>
            ) : (
              <div className="h-12 w-[128px]" />
            )}
          </div>
        </div>
      </div>

      {/* --- TABS CHỌN SHOP --- */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex border-b border-outline gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('utility')}
            className={`pb-4 text-[17px] font-bold relative transition-colors ${activeTab === 'utility' ? 'text-primary' : 'text-secondary-text hover:text-foreground'}`}
          >
            Cửa Hàng Tiện Ích
            {activeTab === 'utility' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"></div>}
          </button>

          <button
            onClick={() => setActiveTab('elite')}
            className={`pb-4 text-[17px] font-bold relative transition-colors ${activeTab === 'elite' ? 'text-primary' : 'text-secondary-text hover:text-foreground'}`}
          >
            Chợ Tinh Anh
            {activeTab === 'elite' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"></div>}
          </button>

          <button
            onClick={() => setActiveTab('legendary')}
            className={`pb-4 text-[17px] font-bold relative transition-colors ${activeTab === 'legendary' ? 'text-primary' : 'text-secondary-text hover:text-foreground'}`}
          >
            Điện Huyền Thoại
            {activeTab === 'legendary' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"></div>}
          </button>
        </div>
      </div>

      {/* --- GRID VẬT PHẨM --- */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        {isLoadingItems ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : getFilteredItems().length === 0 ? (
          <div className="text-center py-20 bg-surface border border-outline rounded-3xl">
            <span className="material-symbols-outlined text-5xl text-secondary-text">storefront</span>
            <p className="text-secondary-text mt-2">Hiện tại không có vật phẩm nào khả dụng trong danh mục này.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6`}>
            {items.map((item) => {
              const isUtility = item.rarity === 'common';
              const isElite = item.rarity === 'rare' || item.rarity === 'epic';
              const isLegendary = item.rarity === 'legendary';

              let shouldShow = false;
              if (activeTab === 'utility' && isUtility) shouldShow = true;
              if (activeTab === 'elite' && isElite) shouldShow = true;
              if (activeTab === 'legendary' && isLegendary) shouldShow = true;

              const displayClass = shouldShow ? 'flex' : 'hidden';

              const isEpic = item.rarity === 'epic';
              const isRare = item.rarity === 'rare';

              // Thiết lập border lấp lánh cho legendary / epic
              const cardClass = isLegendary
                ? 'bg-surface border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20 text-foreground'
                : 'bg-surface border border-outline hover:border-primary/40 text-foreground';

              return (
                <div
                  key={item.id}
                  className={`flex-col rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md ${cardClass} ${displayClass}`}
                >
                  {/* Ảnh hoặc Khung hiển thị */}
                  <div className="aspect-square w-full bg-hover-bg/30 rounded-2xl flex items-center justify-center relative overflow-hidden mb-4 border border-outline/40">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className="w-3/4 h-3/4 object-contain transition-transform duration-500 hover:scale-110"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-secondary-text">image</span>
                    )}

                    {/* Badge độ hiếm */}
                    <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isLegendary ? 'bg-amber-500 text-black' :
                      isEpic ? 'bg-pink-500 text-white' :
                        isRare ? 'bg-sky-500 text-white' : 'bg-secondary text-secondary-text'
                      }`}>
                      {item.rarity}
                    </span>
                  </div>

                  {/* Thông tin */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base line-clamp-1 text-foreground">
                        {item.name}
                      </h3>
                      <p className="text-xs mt-1 min-h-[32px] line-clamp-2 text-secondary-text">
                        {item.description || 'Chưa có mô tả cụ thể cho vật phẩm này.'}
                      </p>
                    </div>

                    {/* Nút mua & Định giá */}
                    <div className="mt-4 pt-3 border-t border-outline/30">
                      {isUtility && (
                        <button
                          disabled={isBuyingItemId === item.id}
                          onClick={() => handleBuyClick(item, 'free')}
                          className="w-full h-10 bg-primary hover:bg-primary/95 text-white disabled:bg-primary/40 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-sm"
                        >
                          <span className="material-symbols-outlined text-base">shopping_cart</span>
                          {item.price_free} Free
                        </button>
                      )}

                      {isElite && (
                        <div className="flex flex-col gap-2">
                          <button
                            disabled={isBuyingItemId === item.id}
                            onClick={() => handleBuyClick(item, 'free')}
                            className="w-full h-9 border border-outline hover:bg-hover-bg disabled:bg-transparent text-foreground font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs"
                          >
                            Mua bằng: {item.price_free} Free
                          </button>
                          <button
                            disabled={isBuyingItemId === item.id}
                            onClick={() => handleBuyClick(item, 'paid')}
                            className="w-full h-9 bg-primary hover:bg-primary/95 text-white disabled:bg-primary/40 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs"
                          >
                            Mua bằng: {item.price_paid} Paid / {item.price_shop} {shopQuotaLabel}
                          </button>
                        </div>
                      )}

                      {isLegendary && (
                        <button
                          disabled={isBuyingItemId === item.id}
                          onClick={() => handleBuyClick(item, 'shop')}
                          className="w-full h-10 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 disabled:opacity-50 text-black font-extrabold rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all text-sm"
                        >
                          <span className="material-symbols-outlined text-base filled">diamond</span>
                          {item.price_shop} {shopQuotaLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODAL XÁC NHẬN MUA --- */}
      {showConfirmModal && confirmItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-outline max-w-md w-full rounded-3xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-2">Xác nhận giao dịch</h2>
            <p className="text-sm text-secondary-text mb-4">
              Bạn có chắc chắn muốn mua vật phẩm này?
            </p>

            <div className="flex gap-4 items-center bg-hover-bg/30 p-4 rounded-2xl mb-6 border border-outline/40">
              <div className="w-16 h-16 bg-surface rounded-xl flex items-center justify-center border border-outline/50 shrink-0">
                {confirmItem.image_url ? (
                  <img src={confirmItem.image_url} alt={confirmItem.name} className="w-12 h-12 object-contain" />
                ) : (
                  <span className="material-symbols-outlined text-2xl text-secondary-text">image</span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm">{confirmItem.name}</h4>
                <p className="text-xs text-secondary-text mt-0.5 uppercase tracking-wider font-bold">
                  {confirmItem.rarity} • {confirmItem.reward_type}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-semibold text-secondary-text">Thanh toán bằng:</span>
              <span className="font-extrabold text-primary flex items-center gap-1">
                {selectedMethod === 'free' && `${confirmItem.price_free} Free`}
                {selectedMethod === 'paid' && `${confirmItem.price_paid} Paid`}
                {selectedMethod === 'shop' && `${confirmItem.price_shop} ${shopQuotaLabel}`}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirmModal(false); setConfirmItem(null); }}
                className="flex-1 h-11 border border-outline hover:bg-hover-bg rounded-xl font-bold transition-all"
              >
                Hủy
              </button>
              <button
                onClick={() => executePurchase(selectedMethod)}
                className="flex-1 h-11 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CẢNH BÁO BÙ TRỪ SPLIT SPEND --- */}
      {showSplitWarning && confirmItem && splitDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-outline max-w-md w-full rounded-3xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 text-amber-500 mb-3">
              <span className="material-symbols-outlined text-2xl filled">warning</span>
              <h2 className="text-lg font-bold text-foreground">Số dư Free Coin không đủ</h2>
            </div>

            <p className="text-sm text-secondary-text mb-4 leading-relaxed">
              Bạn đang thiếu <span className="font-bold text-foreground">{splitDetails.paidDeduct} {coinLabel} Free</span>. Hệ thống sẽ tự động khấu trừ hết ví Free hiện có của bạn và trừ phần thiếu vào ví Paid theo tỷ lệ 1-1:
            </p>

            <div className="space-y-2 bg-hover-bg/30 p-4 rounded-2xl mb-6 border border-outline/40 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-text">Khấu trừ ví Free:</span>
                <span className="font-semibold text-amber-500">-{splitDetails.freeDeduct} Coin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-text">Khấu trừ ví Paid (Bù trừ):</span>
                <span className="font-semibold text-sky-500">-{splitDetails.paidDeduct} Coin</span>
              </div>
              <div className="border-t border-outline/50 my-2 pt-2 flex justify-between font-bold">
                <span>Tổng giá trị vật phẩm:</span>
                <span>{confirmItem.price_free} Coin</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowSplitWarning(false); setConfirmItem(null); setSplitDetails(null); }}
                className="flex-1 h-11 border border-outline hover:bg-hover-bg rounded-xl font-bold transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => executePurchase('free')}
                className="flex-1 h-11 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all"
              >
                Đồng ý thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL MUA THÀNH CÔNG (CONGRATS) --- */}
      {successItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-outline max-w-md w-full rounded-3xl p-8 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto">
            <span className="material-symbols-outlined text-6xl text-amber-500 animate-bounce">emoji_events</span>

            <h2 className="text-2xl font-black mt-4 bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">
              Mua thành công!
            </h2>
            <p className="text-sm text-secondary-text mt-1">
              Vật phẩm đã được thêm vào kho đồ của bạn.
            </p>

            <div className="w-40 h-40 mx-auto bg-hover-bg/30 rounded-full flex items-center justify-center my-6 border border-outline/50">
              {successItem.reward_item.image_url ? (
                <img src={successItem.reward_item.image_url} alt={successItem.reward_item.name} className="w-28 h-28 object-contain" />
              ) : (
                <span className="material-symbols-outlined text-4xl text-secondary-text">image</span>
              )}
            </div>

            <h3 className="font-extrabold text-lg text-foreground mb-6">
              {successItem.reward_item.name}
            </h3>

            <div className="flex gap-3">
              <button
                onClick={() => setSuccessItem(null)}
                className="flex-1 h-12 border border-outline hover:bg-hover-bg rounded-xl font-bold transition-all text-sm"
              >
                Đóng
              </button>
              {(successItem.reward_item.reward_type === 'avatar_frame' || successItem.reward_item.reward_type === 'title') && (
                <button
                  disabled={isEquipping}
                  onClick={handleEquipNow}
                  className="flex-1 h-12 bg-primary hover:bg-primary/95 text-white disabled:opacity-50 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-1"
                >
                  {isEquipping ? 'Đang trang bị...' : 'Trang bị ngay'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL NẠP TIỀN (TOP UP) --- */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-surface border border-outline max-w-lg w-full rounded-3xl shadow-xl animate-in fade-in zoom-in-95 duration-200 my-8 max-h-[90vh] flex flex-col overflow-hidden relative">

            {/* Header Modal cố định ở trên cùng */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-outline/50 bg-surface shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-primary">add_card</span>
                </div>
                <h2 className="text-lg font-black text-foreground">Nạp hạn ngạch mua sắm</h2>
              </div>
              <button
                onClick={closeTopUp}
                className="w-8 h-8 rounded-full border border-outline flex items-center justify-center hover:bg-hover-bg transition-colors"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Body Modal cuộn độc lập bên dưới */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {!qrData ? (
                <div>
                  {/* Hướng dẫn */}
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary-text block mb-3">
                    Số lượng {coinLabel} muốn nạp
                  </label>

                  {/* Grid 4 nút preset có border line riêng cho từng nút */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[10, 50, 100, 200].map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => { setTopUpAmount(amount); setIsCustomAmount(false); }}
                        className={`h-12 rounded-xl font-bold text-sm border transition-all text-left px-5 flex items-center justify-between ${topUpAmount === amount && !isCustomAmount
                          ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                          : 'border-outline hover:bg-hover-bg text-foreground'
                          }`}
                      >
                        <span>{amount} {coinLabel}</span>
                        {topUpAmount === amount && !isCustomAmount && (
                          <span className="material-symbols-outlined text-lg filled">check_circle</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Ô nhập số lượng tự chọn riêng biệt */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-outline rounded-xl p-3 mb-6 bg-surface">
                    <span className="text-sm font-bold text-secondary-text px-2">Số lượng tự chọn</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Nhập số..."
                      value={isCustomAmount ? topUpAmount : ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          setTopUpAmount(val);
                          setIsCustomAmount(true);
                        } else {
                          setTopUpAmount(10);
                          setIsCustomAmount(false);
                        }
                      }}
                      className="h-9 px-3 border border-outline rounded-lg bg-surface text-sm font-bold focus:outline-none focus:border-primary w-full sm:max-w-[180px]"
                    />
                  </div>

                  {/* Bảng thông tin thanh toán phẳng thoáng mát (không có gridline phân tách) */}
                  <div className="bg-hover-bg/20 p-5 rounded-2xl border border-outline/50 mb-6 space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-text">Tỷ giá nạp:</span>
                      <span className="font-semibold">500 VNĐ / 1 {coinLabel}</span>
                    </div>
                    <div className="flex justify-between items-center text-sky-500 font-bold">
                      <span>{coinLabel} nhận được:</span>
                      <span className="font-black text-base">+{topUpAmount} (Paid)</span>
                    </div>
                    <div className="flex justify-between items-center text-purple-500 font-bold">
                      <span>{shopQuotaLabel} nhận được:</span>
                      <span className="font-black text-base">+{topUpAmount}</span>
                    </div>
                    <div className="border-t border-outline/40 my-2 pt-3 flex justify-between items-center font-black text-base text-foreground">
                      <span>Tổng tiền thanh toán:</span>
                      <span className="text-lg">{(topUpAmount * 500).toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>

                  {/* Footnote nhỏ dưới cùng */}
                  <p className="text-[11px] italic text-secondary-text leading-relaxed mb-6 px-1">
                    {lang === 'zh'
                      ? `*Thần thạch dùng để mua sắm các vật phẩm độc quyền tại cửa hàng, Linh thạch dùng để sử dụng dịch vụ hệ thống`
                      : `*Đá quý dùng để mua sắm các vật phẩm độc quyền tại cửa hàng, Coin dùng để sử dụng dịch vụ hệ thống`}
                  </p>

                  <button
                    disabled={isGeneratingQR}
                    onClick={handleGenerateQR}
                    className="w-full h-12 bg-primary hover:bg-primary/95 text-white disabled:opacity-50 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    {isGeneratingQR ? 'Đang khởi tạo giao dịch...' : 'Tiến hành thanh toán'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-secondary-text mb-4">
                    Vui lòng quét mã VietQR bên dưới hoặc chuyển khoản chính xác nội dung để hệ thống tự động cộng coin sau 1-3 phút.
                  </p>

                  <div className="bg-white p-3 rounded-2xl max-w-[220px] mx-auto border border-neutral-200 shadow-sm mb-4">
                    <img src={qrData.qr_url} alt="VietQR" className="w-full aspect-square" />
                  </div>

                  <div className="space-y-2 text-left bg-hover-bg/30 p-4 rounded-2xl border border-outline/40 text-xs mb-6">
                    <div className="flex justify-between">
                      <span className="text-secondary-text">Ngân hàng:</span>
                      <span className="font-bold text-foreground">{qrData.bank_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-text">Số tài khoản:</span>
                      <span className="font-bold text-foreground">{qrData.account_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-text">Chủ tài khoản:</span>
                      <span className="font-bold text-foreground">{qrData.account_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-text">Số tiền:</span>
                      <span className="font-bold text-primary">{qrData.price.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <div className="border-t border-outline/50 my-1 pt-1.5 flex justify-between font-bold text-foreground">
                      <span>Nội dung chuyển khoản:</span>
                      <span className="text-right text-primary font-black tracking-wide">{qrData.transfer_content}</span>
                    </div>
                  </div>

                  <button
                    onClick={closeTopUp}
                    className="w-full h-12 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-md transition-all"
                  >
                    Xác nhận đã chuyển khoản
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- ALERT MODAL --- */}
      <AlertModal
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
