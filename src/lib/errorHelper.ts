/**
 * Helper utility to parse and translate API responses/errors into user-friendly messages.
 */

const FIELD_NAMES_VI: Record<string, string> = {
  old_password: 'Mật khẩu cũ',
  new_password: 'Mật khẩu mới',
  confirm_password: 'Xác nhận mật khẩu',
  username: 'Tên đăng nhập',
  email: 'Địa chỉ email',
  first_name: 'Tên',
  last_name: 'Họ',
  bio: 'Tiểu sử',
  avatar: 'Ảnh đại diện',
  name: 'Tên',
  description: 'Mô tả',
  vocabulary: 'Từ vựng',
  pinyin: 'Bính âm (Pinyin)',
  meaning: 'Ý nghĩa',
  note: 'Ghi chú',
  title: 'Tiêu đề',
  guest_name: 'Họ tên khách',
  guest_email: 'Email khách',
};

const COMMON_ERRORS_VI: Record<string, string> = {
  'This field is required.': 'Trường này không được để trống.',
  'This field may not be blank.': 'Trường này không được để trống.',
  'This field may not be null.': 'Trường này không được để trống.',
  'Enter a valid email address.': 'Định dạng email không hợp lệ.',
  'A user with that username already exists.': 'Tên đăng nhập này đã tồn tại.',
  'This password is too common.': 'Mật khẩu này quá phổ biến.',
  'This password is too short. It must contain at least 8 characters.': 'Mật khẩu quá ngắn, phải chứa ít nhất 8 ký tự.',
  'The two password fields didn\'t match.': 'Hai mật khẩu không khớp nhau.',
  'DatabaseUnavailable': 'Dịch vụ tạm thời không khả dụng do sự cố kết nối cơ sở dữ liệu.',
  'CacheServiceUnavailable': 'Dịch vụ tạm thời không khả dụng do sự cố hệ thống bộ nhớ đệm.',
  'InternalServerError': 'Đã xảy ra lỗi nội bộ trong hệ thống. Vui lòng liên hệ quản trị viên.',
};

/**
 * Translates English validation messages to friendly Vietnamese.
 */
function translateErrorMessage(msg: string): string {
  if (!msg) return '';
  const trimmed = msg.trim();
  if (COMMON_ERRORS_VI[trimmed]) {
    return COMMON_ERRORS_VI[trimmed];
  }
  
  // Dynamic translations
  if (trimmed.startsWith('Ensure this value has at least')) {
    const match = trimmed.match(/\d+/);
    const count = match ? match[0] : '';
    return `Phải chứa ít nhất ${count} ký tự.`;
  }
  if (trimmed.startsWith('Ensure this value has at most')) {
    const match = trimmed.match(/\d+/);
    const count = match ? match[0] : '';
    return `Tối đa ${count} ký tự.`;
  }
  
  return trimmed;
}

export interface ParsedError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

/**
 * Parses any exception/error from API calls, resolving error code and user-friendly message.
 */
export function parseApiError(error: any): ParsedError {
  // If the error is already a string, return directly
  if (typeof error === 'string') {
    return { code: 'CUSTOM_ERROR', message: error };
  }

  // Handle case where error has custom message/rate limit structure from interceptor
  if (error && typeof error === 'object' && error.isRateLimited) {
    return {
      code: error.limitType || 'RateLimit',
      message: error.message || 'Tài khoản đã vượt quá giới hạn gửi yêu cầu. Vui lòng thử lại sau.'
    };
  }

  // Handle Axios response error
  if (error && error.response) {
    const status = error.response.status;
    const data = error.response.data;

    let code = `HTTP_${status}`;
    let message = 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.';
    const fields: Record<string, string> = {};

    if (data && typeof data === 'object') {
      // 1. If backend returns custom exceptions format {"error": "...", "message": "..."}
      if (data.error && data.message) {
        return {
          code: String(data.error),
          message: translateErrorMessage(String(data.message))
        };
      }

      // 2. If it's a Django ValidationError structure (object/dictionary)
      let hasFieldErrors = false;
      for (const [key, value] of Object.entries(data)) {
        // Skip common meta fields
        if (key === 'error' || key === 'message' || key === 'status_code') continue;

        if (key === 'detail') {
          // Standard DRF detail error (e.g. AuthenticationFailed, PermissionDenied)
          const detailStr = String(value);
          
          // Custom mapping for throttled requests
          if (detailStr.toLowerCase().includes('throttled')) {
            code = 'Throttled';
            const match = detailStr.match(/\d+/);
            const seconds = match ? match[0] : '60';
            message = `Bạn đã gửi yêu cầu quá nhanh. Vui lòng đợi ${seconds} giây trước khi gửi lại.`;
          } else {
            message = translateErrorMessage(detailStr);
          }
          continue;
        }

        if (key === 'non_field_errors') {
          const errorsList = Array.isArray(value) ? value : [value];
          message = errorsList.map(err => translateErrorMessage(String(err))).join(' ');
          continue;
        }

        // Field errors
        const errorsList = Array.isArray(value) ? value : [value];
        const translatedMsgs = errorsList.map(err => translateErrorMessage(String(err))).join(' ');
        const fieldName = FIELD_NAMES_VI[key] || key;
        fields[key] = translatedMsgs;
        hasFieldErrors = true;
      }

      if (hasFieldErrors) {
        code = 'ValidationError';
        message = 'Dữ liệu không hợp lệ:\n' + Object.entries(fields)
          .map(([key, value]) => {
            const fieldName = FIELD_NAMES_VI[key] || key;
            return `- ${fieldName}: ${value}`;
          })
          .join('\n');
      }
    } else if (typeof data === 'string') {
      message = data;
    }

    // Default messages by HTTP status if message remains generic
    if (message === 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.') {
      switch (status) {
        case 400:
          message = 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại dữ liệu.';
          break;
        case 401:
          message = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
          break;
        case 403:
          message = 'Bạn không có quyền thực hiện hành động này.';
          break;
        case 404:
          message = 'Không tìm thấy tài nguyên yêu cầu.';
          break;
        case 429:
          message = 'Tài khoản đã vượt quá giới hạn gửi yêu cầu. Vui lòng thử lại sau.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          message = 'Hệ thống đang quá tải hoặc gặp sự cố kết nối máy chủ. Vui lòng thử lại sau.';
          break;
      }
    }

    return { code, message, fields };
  }

  // Handle Axios request error (No response received)
  if (error && error.request) {
    return {
      code: 'NetworkError',
      message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.'
    };
  }

  // Firebase/Other general errors
  if (error && error.message) {
    // Custom Firebase Auth Error mappings
    if (error.code && String(error.code).startsWith('auth/')) {
      let errMsg = 'Có lỗi xảy ra trong quá trình xác thực.';
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          errMsg = 'Email hoặc mật khẩu không chính xác.';
          break;
        case 'auth/email-already-in-use':
          errMsg = 'Email này đã được đăng ký bởi một tài khoản khác.';
          break;
        case 'auth/invalid-email':
          errMsg = 'Địa chỉ email không hợp lệ.';
          break;
        case 'auth/weak-password':
          errMsg = 'Mật khẩu quá yếu (tối thiểu phải có 6 ký tự).';
          break;
        case 'auth/requires-recent-login':
          errMsg = 'Hành động này yêu cầu bạn phải vừa mới đăng nhập gần đây. Vui lòng đăng xuất rồi đăng nhập lại để tiếp tục.';
          break;
      }
      return { code: error.code, message: errMsg };
    }
    return { code: 'JavaScriptError', message: error.message };
  }

  return {
    code: 'UnknownError',
    message: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.'
  };
}

/**
 * Returns just the formatted Vietnamese error message string.
 */
export function getErrorMessage(error: any): string {
  return parseApiError(error).message;
}
