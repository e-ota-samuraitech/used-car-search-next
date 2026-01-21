export function encodeShopSlug(shopName: string): string {
  const input = (shopName ?? '').trim();
  if (!input) return '';

  const bytes = new TextEncoder().encode(input);

  // base64
  let base64: string;
  if (typeof window === 'undefined') {
    base64 = Buffer.from(bytes).toString('base64');
  } else {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }

  // base64url (RFC 4648 §5)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeShopSlug(shopSlug: string): string {
  const input = (shopSlug ?? '').trim();
  if (!input) return '';

  // base64url -> base64
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad === 2) base64 += '==';
  else if (pad === 3) base64 += '=';
  else if (pad !== 0) throw new Error('Invalid shopSlug');

  try {
    if (typeof window === 'undefined') {
      return Buffer.from(base64, 'base64').toString('utf-8');
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    throw new Error('Invalid shopSlug');
  }
}
