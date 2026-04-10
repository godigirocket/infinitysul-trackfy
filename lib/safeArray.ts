/** Always returns a real array — never undefined/null — preventing .map() crashes */
export function safeArray<T>(v: T[] | null | undefined): T[] {
  return Array.isArray(v) ? v : [];
}
