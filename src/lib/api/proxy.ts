import { NextRequest, NextResponse } from 'next/server';

/**
 * Generic handler to proxy incoming Next.js API requests to the backend server.
 * Streams the request and response body to support file uploads and downloads.
 */
export async function handleProxy(
  request: NextRequest,
  targetBaseUrl: string,
  prefixToRemove: string,
  prefixToAdd: string
) {
  const { pathname, search } = request.nextUrl;
  let relativePath = pathname.substring(prefixToRemove.length);
  
  // Django API endpoints expect a trailing slash. Next.js router automatically
  // strips trailing slashes, which breaks POST/PUT/PATCH/DELETE requests.
  // We append a trailing slash if it doesn't already have one, and it's not a file.
  if (pathname.startsWith('/api') && !relativePath.endsWith('/') && !relativePath.includes('.')) {
    relativePath += '/';
  }

  const targetUrl = `${targetBaseUrl}${prefixToAdd}${relativePath}${search}`;

  const headers = new Headers();
  // Copy safe headers from the client request
  const headersToCopy = ['content-type', 'accept', 'authorization', 'cookie', 'x-csrftoken'];
  for (const h of headersToCopy) {
    const val = request.headers.get(h);
    if (val) headers.set(h, val);
  }

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  };

  // Only attach body for mutations
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    fetchOptions.body = request.body;
    // Required in Node fetch when body is a ReadableStream
    // @ts-ignore
    fetchOptions.duplex = 'half';
  }

  try {
    const res = await fetch(targetUrl, fetchOptions);
    const responseHeaders = new Headers();
    const contentType = res.headers.get('content-type');
    if (contentType) responseHeaders.set('content-type', contentType);

    // Forward Set-Cookie headers from Django back to the client browser
    // getSetCookie retrieves all Set-Cookie headers individually
    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    if (setCookies.length > 0) {
      setCookies.forEach(cookie => {
        responseHeaders.append('set-cookie', cookie);
      });
    } else {
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) responseHeaders.set('set-cookie', setCookie);
    }

    // Return the backend's response body directly as a stream
    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error(`[Proxy Error] Failed to proxy from ${pathname} to ${targetUrl}:`, err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
