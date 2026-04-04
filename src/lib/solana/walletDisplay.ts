export function truncateSolanaAddress(a: string, head = 4, tail = 4) {
  if (a.length <= head + tail + 1) return a;
  return `${a.slice(0, head)}…${a.slice(-tail)}`;
}
