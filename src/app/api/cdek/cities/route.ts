import {NextRequest,NextResponse} from "next/server";
import {clientIp,rateLimit,tooManyRequests} from "@/lib/rate-limit";
import {cdekRequest} from "@/lib/cdek";
import {z} from "zod";

type CdekCity={code?:unknown;city?:unknown;full_name?:unknown;region?:unknown;country_code?:unknown};

export async function GET(req:NextRequest){
  const limit=await rateLimit(`cdek-cities:${clientIp(req)}`,60,10*60_000);
  if(limit.limited)return tooManyRequests(limit.retryAfter);
  const query=z.string().trim().min(2).max(60).safeParse(req.nextUrl.searchParams.get("q")||"");
  if(!query.success)return NextResponse.json({cities:[]});
  try{
    const params=new URLSearchParams({name:query.data,country_code:"RU"});
    const response=await cdekRequest<CdekCity[]|CdekCity|{cities?:CdekCity[]}>(`/location/suggest/cities?${params}`);
    const list=Array.isArray(response)?response:"cities" in response&&Array.isArray(response.cities)?response.cities:[response as CdekCity];
    const cities=list.flatMap(city=>{
      const code=Number(city.code),name=String(city.city||city.full_name||"").trim(),region=String(city.region||"").trim();
      if(!Number.isInteger(code)||code<=0||!name)return [];
      return [{code,name,region,label:region?`${name}, ${region}`:name}];
    });
    return NextResponse.json({cities},{headers:{"Cache-Control":"private, max-age=300, stale-while-revalidate=600"}});
  }catch(error){
    const errorCode=error instanceof Error?error.message:"CDEK_UNKNOWN_ERROR";
    if(errorCode!=="CDEK_NOT_CONFIGURED"&&errorCode!=="CDEK_AUTH_FAILED")console.error("CDEK city lookup failed",error);
    const authError=errorCode==="CDEK_AUTH_FAILED"||errorCode==="CDEK_REQUEST_FAILED_401"||errorCode==="CDEK_REQUEST_FAILED_403";
    const message=errorCode==="CDEK_NOT_CONFIGURED"?"Для поиска городов не заданы ключи API СДЭК.":authError?"СДЭК не принял ключи API. Проверьте CDEK_CLIENT_ID и CDEK_CLIENT_SECRET в настройках сервера, затем перезапустите приложение.":"Не удалось найти город в справочнике СДЭК. Попробуйте позже.";
    return NextResponse.json({cities:[],error:message},{status:errorCode==="CDEK_NOT_CONFIGURED"?503:502,headers:{"Cache-Control":"no-store"}});
  }
}
