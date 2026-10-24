import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {productionCostSettingsSchema} from "@/lib/plastic-admin";

export async function PATCH(req:NextRequest){const user=await currentUser();if(user?.role!=="ADMIN")return NextResponse.json({error:"Нет доступа"},{status:403});const parsed=productionCostSettingsSchema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||"Проверьте поля"},{status:400});await db.$transaction([db.productionCostSettings.upsert({where:{id:"main"},update:parsed.data,create:{id:"main",...parsed.data}}),db.auditLog.create({data:{actorId:user.id,action:"ADMIN_UPDATE_PRODUCTION_COSTS",entityType:"ProductionCostSettings",entityId:"main",after:{printerName:parsed.data.printerName,resourceHours:parsed.data.resourceHours,powerWatts:parsed.data.powerWatts}}})]);return NextResponse.json({ok:true})}
