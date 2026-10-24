/** Only vendor HTTPS hosts may supply waybills; credentials stay on the API origin. */
export function cdekDownloadUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || !(url.hostname === "cdek.ru" || url.hostname.endsWith(".cdek.ru"))) {
    throw new Error("Недопустимый адрес квитанции СДЭК");
  }
  return url;
}
