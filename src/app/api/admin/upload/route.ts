import {randomUUID} from "crypto";
import {mkdir,writeFile} from "fs/promises";
import path from "path";
import {NextRequest,NextResponse} from "next/server";
import sharp from "sharp";
import {currentUser} from "@/lib/auth";
import {rateLimit,tooManyRequests} from "@/lib/rate-limit";

export const runtime="nodejs";

const MAX_INPUT_BYTES=15*1024*1024;
const allowedTypes=new Set(["image/jpeg","image/png","image/webp","image/avif"]);

export async function POST(req:NextRequest){
  const user=await currentUser();
  if(user?.role!=="ADMIN")return NextResponse.json({error:"Нет доступа"},{status:403});
  const limit=await rateLimit(`admin-upload:${user.id}`,30,10*60_000);
  if(limit.limited)return tooManyRequests(limit.retryAfter);
  try{
    const form=await req.formData();
    const file=form.get("file");
    if(!file||typeof file==="string")return NextResponse.json({error:"Выберите изображение"},{status:400});
    if(!allowedTypes.has(file.type))return NextResponse.json({error:"Поддерживаются JPG, PNG, WebP и AVIF"},{status:415});
    if(file.size===0||file.size>MAX_INPUT_BYTES)return NextResponse.json({error:"Файл должен быть от 1 байта до 15 МБ"},{status:413});
    const source=Buffer.from(await file.arrayBuffer());
    const image=sharp(source,{failOn:"warning",limitInputPixels:40_000_000,pages:1,sequentialRead:true}).timeout({seconds:15}).rotate();
    const metadata=await image.metadata();
    if(!metadata.width||!metadata.height||!metadata.format||!["jpeg","png","webp","avif"].includes(metadata.format))return NextResponse.json({error:"Не удалось прочитать изображение"},{status:400});
    if(metadata.width*metadata.height>40_000_000)return NextResponse.json({error:"Слишком большое разрешение изображения"},{status:413});
    const output=await image.resize({width:2000,height:2000,fit:"inside",withoutEnlargement:true}).webp({quality:84,effort:4}).toBuffer();
    const directory=path.join(process.cwd(),"public","uploads","products");
    await mkdir(directory,{recursive:true});
    const name=`${Date.now()}-${randomUUID()}.webp`;
    await writeFile(path.join(directory,name),output,{flag:"wx"});
    return NextResponse.json({url:`/uploads/products/${name}`,size:output.length});
  }catch(error){
    console.error("Product image upload failed",error);
    return NextResponse.json({error:"Не удалось обработать изображение"},{status:400});
  }
}
