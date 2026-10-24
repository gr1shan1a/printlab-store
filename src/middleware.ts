import {NextRequest,NextResponse} from "next/server";

const unsafeMethods=new Set(["POST","PUT","PATCH","DELETE"]);

export function middleware(req:NextRequest){
  const nonce=Buffer.from(crypto.randomUUID()).toString("base64"),development=process.env.NODE_ENV!=="production",https=(process.env.NEXT_PUBLIC_STORE_URL||"").startsWith("https://");
  const csp=["default-src 'self'",`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development?" 'unsafe-eval'":""}`,"style-src 'self' 'unsafe-inline'","img-src 'self' data: https:","font-src 'self' data:","connect-src 'self' https://challenges.cloudflare.com https://api-maps.yandex.ru https://*.maps.yandex.net https://*.yandex.net","frame-src 'self' https://challenges.cloudflare.com https://yandex.ru https://*.yandex.ru","object-src 'none'","base-uri 'self'","form-action 'self'","frame-ancestors 'none'",...(https?["upgrade-insecure-requests"]:[])].join("; ");
  const requestHeaders=new Headers(req.headers);requestHeaders.set("x-nonce",nonce);requestHeaders.set("Content-Security-Policy",csp);

  if(req.nextUrl.pathname.startsWith("/api/")&&unsafeMethods.has(req.method)){
    const isTelegramWebhook=req.nextUrl.pathname==="/api/telegram/webhook",isYooKassaWebhook=req.nextUrl.pathname==="/api/payments/yookassa/webhook",isWebhook=isTelegramWebhook||isYooKassaWebhook,isUpload=req.nextUrl.pathname==="/api/admin/upload",isModelUpload=req.nextUrl.pathname==="/api/upload/model",isPrintUpload=req.nextUrl.pathname.startsWith("/api/admin/print-files");
    const isCheckout=req.nextUrl.pathname==="/api/checkout";
    const length=Number(req.headers.get("content-length")||0),max=isUpload?16*1024*1024:isModelUpload?26*1024*1024:isPrintUpload?101*1024*1024:isCheckout?64*1024:1024*1024;
    if(!Number.isFinite(length)||length<0||length>max)return NextResponse.json({error:"Запрос слишком большой"},{status:413});
    const contentType=req.headers.get("content-type")?.toLowerCase()||"";
    if((isUpload||isModelUpload||isPrintUpload)?!contentType.startsWith("multipart/form-data"):!contentType.startsWith("application/json"))return NextResponse.json({error:"Неподдерживаемый формат запроса"},{status:415});
    if(!isWebhook){
      if(req.headers.get("sec-fetch-site")==="cross-site")return NextResponse.json({error:"Запрос с другого сайта запрещён"},{status:403});
      const origin=req.headers.get("origin"),target=process.env.NEXT_PUBLIC_STORE_URL||req.nextUrl.origin;
      if(!origin||!target){return NextResponse.json({error:"Не удалось проверить источник запроса"},{status:403})}
      try{if(new URL(origin).origin!==new URL(target).origin)return NextResponse.json({error:"Запрос с другого сайта запрещён"},{status:403})}catch{return NextResponse.json({error:"Некорректный источник запроса"},{status:403})}
    }
  }

  const response=NextResponse.next({request:{headers:requestHeaders}});
  response.headers.set("Content-Security-Policy",/^\/uploads\/(models|print-files)\//.test(req.nextUrl.pathname)?"sandbox; default-src 'none'":csp);
  response.headers.set("Vary","Origin, Sec-Fetch-Site");
  if(req.nextUrl.pathname.startsWith("/api/"))response.headers.set("Cache-Control","no-store");
  return response;
}

export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
