import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio_file') || formData.get('audio'); // support both keys just in case
    const targetText = formData.get('target_text');
    const language = formData.get('language') || 'en'; // default to English

    if (!audioFile) {
      return NextResponse.json({ detail: 'No audio file provided' }, { status: 400 });
    }

    // Reconstruct FormData for the target microservice
    const microserviceForm = new FormData();
    microserviceForm.append('audio_file', audioFile);
    if (targetText && typeof targetText === 'string') {
      microserviceForm.append('target_text', targetText.trim());
    }

    // Determine target URL based on language parameter
    const servicePath = language === 'zh' ? '/api/ai/zh/score' : '/api/ai/en/score';
    const targetUrl = `${GATEWAY_URL}${servicePath}`;

    const res = await fetch(targetUrl, {
      method: 'POST',
      body: microserviceForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      return new NextResponse(errText, {
        status: res.status,
        headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[API Score Error]:', err);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}
