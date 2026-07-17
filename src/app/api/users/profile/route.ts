import { NextResponse } from 'next/server';
import axios from 'axios';

const DJANGO_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader) {
      return NextResponse.json({ message: 'No authorization header' }, { status: 401 });
    }
    const headers: Record<string, string> = {
      'Authorization': authHeader,
    };
    if (process.env.API_BYPASS_SECRET) {
      headers['x-vercel-signature'] = process.env.API_BYPASS_SECRET;
    }

    const response = await axios.get(
      `${DJANGO_API_URL}/api/core/users/profile/`,
      { headers }
    );
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Get Profile BFF Error:', error.response?.data || error.message);
    return NextResponse.json(
      error.response?.data || { message: 'Lấy thông tin profile thất bại' }, 
      { status: error.response?.status || 500 }
    );
  }
}

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
    const headers: Record<string, string> = {
      'Authorization': authHeader,
      'Content-Type': 'multipart/form-data', 
    };
    if (process.env.API_BYPASS_SECRET) {
      headers['x-vercel-signature'] = process.env.API_BYPASS_SECRET;
    }

    const response = await axios.patch(
      `${DJANGO_API_URL}/api/core/users/profile/`,
      clientFormData,
      {
        headers,
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
