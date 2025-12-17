export const randomChar = (char: string, range: number) => {
  let chars = '';
  for (let i = 0; i < range; i++) {
    chars += char[Math.floor(Math.random() * char.length)];
  }
  return chars;
};

export const generateDeviceId = () => {
  const prefix = '7';
  const random = randomChar('0123456789', 18);
  return `${prefix}${random}`;
};

export const generateOdinId = () => {
  const prefix = '7';
  const random = randomChar('0123456789', 18);
  return `${prefix}${random}`;
};

export const extractMsToken = (
  headers: Record<string, any>,
): string | undefined => {
  if (!headers) {
    return undefined;
  }

  // First try to extract from set-cookie header
  const setCookies = headers['set-cookie'];
  if (setCookies) {
    const cookies = Array.isArray(setCookies) ? setCookies : [setCookies];
    const msTokenCookie = cookies.find((cookie: string) =>
      cookie.includes('msToken='),
    );
    if (msTokenCookie) {
      const match = msTokenCookie.match(/msToken=([^;]+)/);
      if (match?.[1]) {
        return match[1];
      }
    }
  }

  // Second try to extract from x-ms-token header
  const xMsToken = headers['x-ms-token'];
  if (xMsToken) {
    return xMsToken;
  }

  return undefined;
};
