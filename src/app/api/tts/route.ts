import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TTS_SERVICE_URL = process.env.TTS_SERVICE_URL || 'http://localhost:8002';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const lang = searchParams.get('lang') || 'zh';
    const voice = searchParams.get('voice');

    if (!text) {
      return NextResponse.json({ detail: 'Text parameter is required' }, { status: 400 });
    }

    // Build the target microservice URL
    let targetUrl = `${TTS_SERVICE_URL}/api/v1/tts?text=${encodeURIComponent(text.trim())}&lang=${lang}`;
    if (voice) {
      targetUrl += `&voice=${encodeURIComponent(voice)}`;
    }

    loggerInfo(`[Next.js TTS Proxy] Proxying request to: ${targetUrl}`);

    const headers = new Headers();
    if (process.env.API_BYPASS_SECRET) {
      headers.set('x-vercel-signature', process.env.API_BYPASS_SECRET);
    }

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Next.js TTS Proxy] TTS service error status=${res.status}: ${errText}`);
      return new NextResponse(errText, {
        status: res.status,
        headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
      });
    }

    const audioBuffer = await res.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year since words/phrases are static
      },
    });
  } catch (err) {
    console.error('[Next.js TTS Proxy Error]:', err);
    return NextResponse.json({ detail: 'TTS Service Unavailable' }, { status: 503 });
  }
}

function loggerInfo(msg: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(msg);
  }
}
