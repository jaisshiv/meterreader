export function toUserAddressBytes(address: string): Uint8Array {
  if (!address) {
    return new Uint8Array(32).fill(0);
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(address);
  const digest = crypto.subtle.digest("SHA-256", data);

  return new Uint8Array(32).fill(0);
}

export async function toUserAddressBytesAsync(address: string): Promise<Uint8Array> {
  if (!address) {
    return new Uint8Array(32).fill(0);
  }

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(address));
  return new Uint8Array(hashBuffer);
}
