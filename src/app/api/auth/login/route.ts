import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {createSession} from "@/lib/auth";
import {clientIp,rateLimit,tooManyRequests} from "@/lib/rate-limit";
import {verifyCaptcha} from "@/lib/captcha";
import {verifyPassword,hashPassword} from "@/lib/password";

const schema=z.object({email:z.string().trim().email().max(160),password:z.string().min(1).max(100),captchaToken:z.string().max(2048)});
const DUMMY_HASH="$2a$12$pn6.aekHntCff09b.rmeAeV7Yf7SlFxm/d7vbg8YiGFeWSbIsGOy.";
const LOCK_MS=5*60_000;

export async function POST(req:NextRequest){
  const [ipLimit,globalLimit]=await Promise.all([rateLimit(`login-ip:${clientIp(req)}`,5,5*60_000),rateLimit("login:global",300,5*60_000)]);
  if(ipLimit.limited||globalLimit.limited)return tooManyRequests(Math.max(ipLimit.retryAfter,globalLimit.retryAfter));
  const body=await req.json().catch(()=>null),parsed=schema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:"Проверьте email, пароль и защитный код"},{status:400});
  if(!await verifyCaptcha(parsed.data.captchaToken,clientIp(req)))return NextResponse.json({error:"Подтвердите проверку Cloudflare"},{status:400});
  const email=parsed.data.email.toLowerCase(),user=await db.user.findUnique({where:{email}}),now=new Date();
  if(user?.loginLockedUntil&&user.loginLockedUntil>now)return tooManyRequests(Math.ceil((user.loginLockedUntil.getTime()-now.getTime())/1000),"Слишком много ошибок. Повторите вход через 5 минут");
  const verification=await verifyPassword(parsed.data.password,user?.passwordHash||DUMMY_HASH);
  if(!user||user.blockedAt||user.deletedAt||!verification.valid){
    if(user){const failed=await db.user.update({where:{id:user.id},data:{failedLoginAttempts:{increment:1}},select:{failedLoginAttempts:true}});if(failed.failedLoginAttempts>=5)await db.user.update({where:{id:user.id},data:{failedLoginAttempts:0,loginLockedUntil:new Date(Date.now()+LOCK_MS)}})}
    return NextResponse.json({error:"Неверный email или пароль"},{status:401});
  }
  if(!user.emailVerifiedAt)return NextResponse.json({error:"Подтвердите аккаунт по ссылке из письма"},{status:403});
  await db.user.update({where:{id:user.id},data:{failedLoginAttempts:0,loginLockedUntil:null,...(verification.needsUpgrade?{passwordHash:await hashPassword(parsed.data.password)}:{})}});
  await createSession(user.id);
  return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
