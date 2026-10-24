import {randomUUID} from "crypto";
import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {adminProductSchema,normalizeModelUrl} from "@/lib/product-admin";

async function admin(){const user=await currentUser();return user?.role==="ADMIN"?user:null}

export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const user=await admin();
  if(!user)return NextResponse.json({error:"Нет доступа"},{status:403});
  const parsed=adminProductSchema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||"Проверьте поля"},{status:400});
  const {id}=await params,data=parsed.data,modelSourceUrl=normalizeModelUrl(data.modelSourceUrl);
  if(modelSourceUrl===undefined)return NextResponse.json({error:"Разрешены только Cults3D, Thingiverse, Printables и MakerWorld"},{status:400});
  const colors=data.colorSelectable?data.selectableColors:data.fixedColors;
  const fixedColor=data.fixedColors.join(" / ");
  const priceInKopecks=Math.min(...data.configurations.map(configuration=>configuration.priceInKopecks));
  const variants=data.configurations.flatMap(configuration=>(data.colorSelectable?data.selectableColors:[fixedColor]).map(color=>({configuration:configuration.name,color,priceInKopecks:configuration.priceInKopecks,stock:configuration.stock})));
  try{
    await db.$transaction(async tx=>{
      const old=await tx.product.findUniqueOrThrow({where:{id},include:{variants:true}});
      const oldByCombination=new Map(old.variants.map(variant=>[`${variant.configuration||variant.size||"Стандартная"}\u0000${variant.color}`,variant]));
      for(const variant of variants){const stored=oldByCombination.get(`${variant.configuration}\u0000${variant.color}`);if(stored&&variant.stock<stored.reserved)throw new Error(`Остаток варианта «${variant.configuration}» не может быть меньше резерва (${stored.reserved})`)}
      await tx.product.update({where:{id},data:{name:data.name,slug:data.slug,sku:data.sku,categoryId:data.categoryId,categories:{set:data.categoryIds.filter(categoryId=>categoryId!==data.categoryId).map(id=>({id}))},shortDescription:data.shortDescription,description:data.description,priceInKopecks,oldPriceInKopecks:data.oldPriceInKopecks,material:data.material,color:colors.join(" / "),colorSelectable:data.colorSelectable,fixedColors:data.fixedColors,dimensions:data.dimensions,weightGrams:data.weightGrams,plasticWeightGrams:data.plasticWeightGrams,leadTimeDays:data.leadTimeDays,featured:data.featured,active:data.active,archivedAt:data.active?null:old.archivedAt,modelSourceUrl}});
      await tx.productImage.deleteMany({where:{productId:id}});
      await tx.productImage.createMany({data:data.imageUrls.map((url,position)=>({productId:id,url,position,alt:data.name}))});
      const submittedIds=new Set<string>();
      for(const variant of variants){const stored=oldByCombination.get(`${variant.configuration}\u0000${variant.color}`),variantData={configuration:variant.configuration,material:data.material,color:variant.color,priceInKopecks:variant.priceInKopecks,stock:variant.stock,active:true};if(stored){submittedIds.add(stored.id);await tx.productVariant.update({where:{id:stored.id},data:variantData})}else{const created=await tx.productVariant.create({data:{...variantData,productId:id,sku:`${data.sku}-${randomUUID().slice(0,8).toUpperCase()}`}});submittedIds.add(created.id)}}
      await tx.productVariant.updateMany({where:{productId:id,id:{notIn:[...submittedIds]}},data:{active:false}});
      await tx.auditLog.create({data:{actorId:user.id,action:"ADMIN_UPDATE_PRODUCT",entityType:"Product",entityId:id,before:{name:old.name,sku:old.sku},after:{name:data.name,sku:data.sku,variants:variants.length}}});
    });
    return NextResponse.json({ok:true});
  }catch(error){const message=error instanceof Error?error.message:"";return NextResponse.json({error:message.includes("Unique")?"Slug или артикул уже используется":message.startsWith("Остаток")||message.startsWith("Некорректный")?message:"Не удалось сохранить товар"},{status:409})}
}

export async function DELETE(_:NextRequest,{params}:{params:Promise<{id:string}>}){const user=await admin();if(!user)return NextResponse.json({error:"Нет доступа"},{status:403});const {id}=await params;const old=await db.product.findUnique({where:{id}});if(!old)return NextResponse.json({error:"Товар не найден"},{status:404});await db.$transaction([db.product.update({where:{id},data:{active:false,archivedAt:new Date()}}),db.auditLog.create({data:{actorId:user.id,action:"ADMIN_ARCHIVE_PRODUCT",entityType:"Product",entityId:id,before:{active:old.active},after:{active:false}}})]);return NextResponse.json({ok:true})}
