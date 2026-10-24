import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {adminProductSchema,normalizeModelUrl} from "@/lib/product-admin";

export async function POST(req:NextRequest){
  const user=await currentUser();
  if(user?.role!=="ADMIN")return NextResponse.json({error:"Нет доступа"},{status:403});
  const parsed=adminProductSchema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||"Проверьте поля"},{status:400});
  const data=parsed.data,modelSourceUrl=normalizeModelUrl(data.modelSourceUrl);
  if(modelSourceUrl===undefined)return NextResponse.json({error:"Разрешены только Cults3D, Thingiverse, Printables и MakerWorld"},{status:400});
  const colors=data.colorSelectable?data.selectableColors:data.fixedColors;
  const fixedColor=data.fixedColors.join(" / ");
  const priceInKopecks=Math.min(...data.configurations.map(configuration=>configuration.priceInKopecks));
  const variants=data.configurations.flatMap(configuration=>(data.colorSelectable?data.selectableColors:[fixedColor]).map(color=>({configuration:configuration.name,color,priceInKopecks:configuration.priceInKopecks,stock:configuration.stock})));
  try{
    const product=await db.$transaction(async tx=>{
      const created=await tx.product.create({data:{name:data.name,slug:data.slug,sku:data.sku,categoryId:data.categoryId,categories:{connect:data.categoryIds.filter(id=>id!==data.categoryId).map(id=>({id}))},shortDescription:data.shortDescription,description:data.description,priceInKopecks,oldPriceInKopecks:data.oldPriceInKopecks,material:data.material,color:colors.join(" / "),colorSelectable:data.colorSelectable,fixedColors:data.fixedColors,dimensions:data.dimensions,weightGrams:data.weightGrams,plasticWeightGrams:data.plasticWeightGrams,leadTimeDays:data.leadTimeDays,featured:data.featured,active:data.active,modelSourceUrl,images:{create:data.imageUrls.map((url,position)=>({url,position,alt:data.name}))},variants:{create:variants.map((variant,index)=>({sku:`${data.sku}-${String(index+1).padStart(2,"0")}`,configuration:variant.configuration,material:data.material,color:variant.color,priceInKopecks:variant.priceInKopecks,stock:variant.stock}))}}});
      await tx.auditLog.create({data:{actorId:user.id,action:"ADMIN_CREATE_PRODUCT",entityType:"Product",entityId:created.id,after:{name:data.name,sku:data.sku,variants:variants.length}}});
      return created;
    });
    return NextResponse.json({ok:true,id:product.id},{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error&&error.message.includes("Unique")?"Slug или артикул уже используется":"Не удалось создать товар"},{status:409})}
}
