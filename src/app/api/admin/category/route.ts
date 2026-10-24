import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {z} from "zod";
const input=z.object({name:z.string().trim().min(2,"Введите название категории").max(60),slug:z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,"Slug: латиница, цифры и дефисы").max(80),sortOrder:z.number().int().min(0).max(10000)});
export async function POST(req:NextRequest){const user=await currentUser();if(user?.role!=="ADMIN")return NextResponse.json({error:"Нет доступа"},{status:403});const parsed=input.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||"Проверьте поля"},{status:400});try{const category=await db.$transaction(async tx=>{const created=await tx.category.create({data:parsed.data});await tx.auditLog.create({data:{actorId:user.id,action:"ADMIN_CREATE_CATEGORY",entityType:"Category",entityId:created.id,after:parsed.data}});return created});return NextResponse.json(category,{status:201})}catch{return NextResponse.json({error:"Категория с таким slug уже существует"},{status:409})}}
