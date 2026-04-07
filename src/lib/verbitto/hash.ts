/** SHA-256 хэш UTF-8 строки в 64 hex-символа (как `createHash('sha256').update(s,'utf8')` на сервере). */
export async function sha256Utf8Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/** 64 hex → 32 байта для UInt8Array / Anchor [u8;32]. */
export function hexToBytes32(hex: string): Uint8Array {
  const h = hex.replace(/^0x/i, "").trim();
  if (h.length !== 64 || !/^[0-9a-fA-F]+$/.test(h)) {
    throw new Error("descriptionHashHex must be 64 hex characters");
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
