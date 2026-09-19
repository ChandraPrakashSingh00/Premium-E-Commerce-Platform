/** Joins truthy class names. `cn('a', cond && 'b', { c: true })` */
export function cn(...args) {
  const out = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'string') out.push(arg);
    else if (Array.isArray(arg)) out.push(cn(...arg));
    else if (typeof arg === 'object') {
      for (const [key, value] of Object.entries(arg)) if (value) out.push(key);
    }
  }
  return out.join(' ');
}
