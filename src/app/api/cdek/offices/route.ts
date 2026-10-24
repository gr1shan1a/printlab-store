import {NextRequest,NextResponse} from "next/server";
import {clientIp,rateLimit,tooManyRequests} from "@/lib/rate-limit";
import {cdekRequest} from "@/lib/cdek";
import {z} from "zod";

type CdekPoint={code?:unknown;name?:unknown;type?:unknown;work_time?:unknown;location?:{city?:unknown;city_code?:unknown;address?:unknown;latitude?:unknown;longitude?:unknown}};
const officeCache=new Map<number,{value:unknown[];expiresAt:number}>();

export async function GET(req:NextRequest){
  const limit=await rateLimit(`cdek-offices:${clientIp(req)}`,30,10*60_000);
  if(limit.limited)return tooManyRequests(limit.retryAfter);
  const parsed=z.coerce.number().int().positive().safeParse(req.nextUrl.searchParams.get("cityCode"));
  if(!parsed.success)return NextResponse.json({error:"Сначала выберите город доставки"},{status:400});
  const cityCode=parsed.data,cached=officeCache.get(cityCode);
  if(cached&&cached.expiresAt>Date.now())return NextResponse.json({configured:true,offices:cached.value},{headers:{"Cache-Control":"public, max-age=300, stale-while-revalidate=3600"}});
  try{
    const raw=await cdekRequest<CdekPoint[]>(`/deliverypoints?country_code=RU&city_code=${encodeURIComponent(cityCode)}`);
    const offices=raw.flatMap(point=>{
      const latitude=Number(point.location?.latitude),longitude=Number(point.location?.longitude),code=String(point.code||"").slice(0,40),address=String(point.location?.address||"").slice(0,260);
      if(!code||!address||!Number.isFinite(latitude)||!Number.isFinite(longitude))return [];
      return [{code,name:String(point.name||"Пункт СДЭК").slice(0,120),type:String(point.type||"PVZ").slice(0,20),city:String(point.location?.city||"").slice(0,100),cityCode:Number(point.location?.city_code||cityCode),address,latitude,longitude,workTime:String(point.work_time||"").slice(0,160)}];
    }).slice(0,1000);
    if (officeCache.size >= 100) officeCache.delete(officeCache.keys().next().value!);
    officeCache.set(cityCode,{value:offices,expiresAt:Date.now()+6*60*60_000});
    return NextResponse.json({configured:true,offices},{headers:{"Cache-Control":"public, max-age=300, stale-while-revalidate=3600"}});
  }catch(error){
    const errorCode=error instanceof Error?error.message:"CDEK_UNKNOWN_ERROR";
    if(errorCode!=="CDEK_NOT_CONFIGURED"&&errorCode!=="CDEK_AUTH_FAILED")console.error("CDEK offices request failed",error);
    const authError=errorCode==="CDEK_AUTH_FAILED"||errorCode==="CDEK_REQUEST_FAILED_401"||errorCode==="CDEK_REQUEST_FAILED_403";
    const message=errorCode==="CDEK_NOT_CONFIGURED"?"Для карты ПВЗ не заданы ключи API СДЭК.":authError?"СДЭК не принял ключи API. Проверьте CDEK_CLIENT_ID и CDEK_CLIENT_SECRET в настройках сервера, затем перезапустите приложение.":"Не удалось загрузить ПВЗ СДЭК. Попробуйте ещё раз позже.";
    return NextResponse.json({configured:false,offices:[],error:message},{status:errorCode==="CDEK_NOT_CONFIGURED"?503:502,headers:{"Cache-Control":"no-store"}});
  }
}
