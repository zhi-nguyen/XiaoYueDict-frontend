import { NextResponse } from 'next/server';
import axios from 'axios';

const DJANGO_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export async function PATCH(request: Request) {
  try {
    // 1. Trích xuất FormData từ Client gửi lên
    const clientFormData = await request.formData();
    
    // 2. Lấy Access Token từ Header
    const authHeader = request.headers.get('Authorization') || '';

    if (!authHeader) {
      return NextResponse.json({ message: 'No authorization header' }, { status: 401 });
    }

    // 3. Chuyển tiếp sang Django Backend (Bổ sung dấu / ở cuối URL)
    const response = await axios.patch(
      `${DJANGO_API_URL}/api/core/users/profile/`,
      clientFormData,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'multipart/form-data', 
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Update Profile BFF Error:', error.response?.data || error.message);
    return NextResponse.json(
      error.response?.data || { message: 'Cập nhật thất bại' }, 
      { status: error.response?.status || 500 }
    );
  }
}
