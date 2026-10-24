import {readFile} from "fs/promises";
import path from "path";
import {NextResponse} from "next/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const productImageName=/^\d{13}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

export async function GET(_:Request,{params}:{params:Promise<{name:string}>}){
  const {name}=await params;
  if(!productImageName.test(name))return new NextResponse("Not found",{status:404});
  try{
    const file=await readFile(path.join(process.cwd(),"public","uploads","products",name));
    return new NextResponse(new Uint8Array(file),{headers:{"Content-Type":"image/webp","Cache-Control":"public, max-age=31536000, immutable","Content-Length":String(file.length),"Content-Disposition":"inline","X-Content-Type-Options":"nosniff","Cross-Origin-Resource-Policy":"same-origin"}});
  }catch(error){
    if((error as NodeJS.ErrnoException).code==="ENOENT")return new NextResponse("Not found",{status:404});
    console.error("Product image read failed",error);
    return new NextResponse("Image read failed",{status:500});
  }
}
