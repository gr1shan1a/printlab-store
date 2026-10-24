import {createHash} from "crypto";
import type {NextRequest} from "next/server";
import {db} from "@/lib/db";

const digest=(value:string)=>createHash("sha256").update(value).digest("hex");

export function clientIp(req:NextRequest){
  // The bundled reverse proxy always overwrites X-Real-IP with its TCP peer.
  // Never prefer client-controlled forwarding headers here.
  const raw=req.headers.get("x-real-ip")||req.headers.get("x-forwarded-for")?.split(",").at(-1)||"unknown";
  const normalized=raw.trim().replace(/[^0-9a-fA-F:.]/g,"");
  return normalized.slice(0,64)||"unknown";
}

export async function rateLimit(key:string,max:number,windowMs:number){
  const hashed=digest(key),resetAt=new Date(Date.now()+windowMs);
  const rows=await db.$queryRaw<{count:number;resetAt:Date}[]>`
    INSERT INTO "ApiRateLimit" ("key","count","resetAt","updatedAt")
    VALUES (${hashed},1,${resetAt},NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "count"=CASE WHEN "ApiRateLimit"."resetAt"<=NOW() THEN 1 ELSE "ApiRateLimit"."count"+1 END,
      "resetAt"=CASE WHEN "ApiRateLimit"."resetAt"<=NOW() THEN ${resetAt} ELSE "ApiRateLimit"."resetAt" END,
      "updatedAt"=NOW()
    RETURNING "count","resetAt"
  `;
  const row=rows[0];
  return {count:row.count,limited:row.count>max,retryAfter:Math.max(1,Math.ceil((row.resetAt.getTime()-Date.now())/1000))};
}

export function tooManyRequests(retryAfter:number,message="Слишком много попыток"){
  return Response.json({error:message},{status:429,headers:{"Retry-After":String(retryAfter),"Cache-Control":"no-store"}});
}
