"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const params = useParams();
  const language = (params?.lang as string) || 'zh';

  const [mounted, setMounted] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Registration fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot password fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    setError('');
    setSuccessMessage('');
    setIsForgotPassword(false);
    setResetSuccess(false);
    
    // Auto sign out unverified user on close if they somehow bypassed state cleanups
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      signOut(auth).catch(console.error);
    }
    
    onClose();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!isForgotPassword && !acceptTerms) {
      setError('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật trước khi tiếp tục.');
      return;
    }

    setLoading(true);

    try {
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, resetEmail);
        setSuccessMessage('Đã gửi liên kết khôi phục mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư!');
        setResetSuccess(true);
      } else if (isLogin) {
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        
        // Check if email is verified
        if (!userCredential.user.emailVerified) {
          // Resend email verification automatically
          await sendEmailVerification(userCredential.user);
          
          setError('Email của bạn chưa được xác nhận. Một email xác nhận mới đã được gửi. Vui lòng xác thực email trước khi đăng nhập.');
          
          // Sign out immediately to avoid State Leak on reload
          await signOut(auth);
          setLoading(false);
          return;
        }
        handleClose();
      } else {
        // Sign up with Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update user display name with username
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName: username });
          
          // Send email verification immediately
          await sendEmailVerification(userCredential.user);
        }
        
        setSuccessMessage('Đăng ký thành công! Một email xác nhận đã được gửi tới email của bạn. Vui lòng xác thực email trước khi đăng nhập.');
        
        // Sign out immediately to prevent client-side auto login
        await signOut(auth);
        
        // Switch to login view for convenience
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      let errMsg = 'Có lỗi xảy ra. Vui lòng thử lại.';
      
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          errMsg = 'Email hoặc mật khẩu không chính xác.';
          break;
        case 'auth/email-already-in-use':
          errMsg = 'Email này đã được sử dụng bởi một tài khoản khác.';
          break;
        case 'auth/invalid-email':
          errMsg = 'Địa chỉ email không hợp lệ.';
          break;
        case 'auth/weak-password':
          errMsg = 'Mật khẩu quá yếu (tối thiểu phải có 6 ký tự).';
          break;
        default:
          if (err.message) errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');

    if (!acceptTerms) {
      setError('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật trước khi tiếp tục.');
      return;
    }

    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      handleClose();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Không thể đăng nhập bằng Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-md p-6 rounded-2xl shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="text-2xl font-bold font-lexend text-primary mb-6 text-center">
          {isForgotPassword 
            ? 'Khôi phục mật khẩu' 
            : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản')}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-600 rounded-lg text-sm text-center">
            {successMessage}
          </div>
        )}

        {isForgotPassword ? (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Email tài khoản</label>
              <input 
                type="email" 
                required
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="Nhập email của bạn..."
                className="w-full px-4 py-2.5 rounded-xl border border-outline bg-hover-bg focus:bg-surface focus:border-sage focus:ring-1 focus:ring-sage transition-all outline-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || resetSuccess}
              className="w-full py-3 mt-2 rounded-xl bg-primary text-white font-bold hover:opacity-90 disabled:opacity-70 transition-opacity"
            >
              {loading ? 'Đang gửi...' : 'Gửi email khôi phục'}
            </button>

            <div className="mt-4 text-center">
              <button 
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setResetSuccess(false);
                }}
                className="text-primary font-bold hover:underline text-sm"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        ) : (
          <>
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Tên hiển thị</label>
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Ví dụ: Tiểu Nguyệt"
                    className="w-full px-4 py-2.5 rounded-xl border border-outline bg-hover-bg focus:bg-surface focus:border-sage focus:ring-1 focus:ring-sage transition-all outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={isLogin ? loginEmail : email}
                  onChange={e => isLogin ? setLoginEmail(e.target.value) : setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-outline bg-hover-bg focus:bg-surface focus:border-sage focus:ring-1 focus:ring-sage transition-all outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-secondary">Mật khẩu</label>
                  {isLogin && (
                    <button 
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
                <input 
                  type="password" 
                  required
                  value={isLogin ? loginPassword : password}
                  onChange={e => isLogin ? setLoginPassword(e.target.value) : setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-outline bg-hover-bg focus:bg-surface focus:border-sage focus:ring-1 focus:ring-sage transition-all outline-none"
                />
              </div>

              <div className="flex items-start gap-2.5 my-3">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-outline text-sage focus:ring-sage focus:ring-opacity-25 mt-0.5 cursor-pointer"
                />
                <label htmlFor="accept-terms" className="text-xs text-secondary leading-normal select-none cursor-pointer">
                  Tôi đồng ý với{' '}
                  <Link href={`/${language}/terms`} target="_blank" className="text-primary underline hover:text-opacity-80 transition-opacity">
                    Điều khoản dịch vụ
                  </Link>{' '}
                  và{' '}
                  <Link href={`/${language}/privacy`} target="_blank" className="text-primary underline hover:text-opacity-80 transition-opacity">
                    Chính sách bảo mật
                  </Link>{' '}
                  của CnenDict.
                </label>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl bg-primary text-white font-bold hover:opacity-90 disabled:opacity-70 transition-opacity"
              >
                {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
              </button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center justify-between">
              <span className="border-b border-outline w-1/5"></span>
              <span className="text-xs text-secondary uppercase font-medium">Hoặc đăng nhập với</span>
              <span className="border-b border-outline w-1/5"></span>
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 flex items-center justify-center border border-outline bg-surface rounded-xl hover:bg-hover-bg transition-colors font-semibold text-primary disabled:opacity-70"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.7 0 3.23.59 4.43 1.73l3.31-3.3C17.75 1.58 15.08 1 12 1 7.24 1 3.2 3.73 1.24 7.74l3.85 2.99C6.01 7.74 8.78 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.7 2.87c2.16-1.99 3.41-4.91 3.41-8.6z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.09 14.75a7.16 7.16 0 0 1 0-4.5l-3.85-2.99a11.96 11.96 0 0 0 0 10.49l3.85-2.99z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.02.68-2.33 1.09-3.96 1.09-3.22 0-5.99-2.7-6.91-5.7L1.24 16.6C3.2 20.61 7.24 23 12 23z"
                />
              </svg>
              Google
            </button>

            <div className="mt-6 text-center text-sm text-secondary">
              {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
              <button 
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-primary font-bold hover:underline"
              >
                {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (mounted && typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}
