import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {plasticMaterialSchema} from "@/lib/plastic-admin";

export async function POST(req:NextRequest){const user=await currentUser();if(user?.role!=="ADMIN")return NextResponse.json({error:"Нет доступа"},{status:403});const parsed=plasticMaterialSchema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||"Проверьте поля"},{status:400});const data=parsed.data;const material=await db.$transaction(async tx=>{const created=await tx.plasticMaterial.create({data:{...data,brand:data.brand||null,supplier:data.supplier||null,notes:data.notes||null}});await tx.auditLog.create({data:{actorId:user.id,action:"ADMIN_CREATE_PLASTIC",entityType:"PlasticMaterial",entityId:created.id,after:{name:created.name,type:created.type,color:created.color}}});return created});return NextResponse.json({ok:true,id:material.id},{status:201})}
