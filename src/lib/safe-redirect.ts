export function safeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(value)) return "/account";
  return value;
}
