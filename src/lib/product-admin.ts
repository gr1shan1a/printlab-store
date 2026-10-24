import {z} from "zod";
import {PRODUCT_COLORS} from "@/lib/product-colors";

export const allowedModelHosts=["cults3d.com","thingiverse.com","printables.com","makerworld.com"];
export function normalizeModelUrl(value:string){if(!value.trim())return null;try{const url=new URL(value.trim());const host=url.hostname.toLowerCase().replace(/^www\./,"");if(!["http:","https:"].includes(url.protocol)||!allowedModelHosts.some(domain=>host===domain||host.endsWith(`.${domain}`)))return undefined;return url.toString()}catch{return undefined}}

const nullableInt=z.union([z.number().int(),z.null()]);
const colorSchema=z.enum(PRODUCT_COLORS,{errorMap:()=>({message:"Выберите цвет из списка"})});
const configurationSchema=z.object({
  name:z.string().trim().min(1,"Укажите комплектацию").max(80),
  priceInKopecks:z.number().int().min(0).max(100_000_000),
  stock:z.number().int().min(0).max(1_000_000),
});
const safeImagePath=/^\/(?:products\/[a-zA-Z0-9._-]+\.(?:png|jpe?g|webp|avif)|uploads\/products\/\d{13}-[0-9a-f-]{36}\.webp)$/;

export const adminProductSchema=z.object({
  name:z.string().trim().min(2).max(120),
  slug:z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  sku:z.string().trim().min(2).max(60),
  categoryId:z.string().min(1),
  categoryIds:z.array(z.string().min(1)).min(1,"Выберите хотя бы одну категорию").max(12),
  shortDescription:z.string().trim().min(3).max(260),
  description:z.string().trim().min(3).max(5000),
  oldPriceInKopecks:nullableInt.refine(value=>value===null||value>=0),
  material:z.string().trim().min(1).max(80),
  colorSelectable:z.boolean(),
  selectableColors:z.array(colorSchema).max(PRODUCT_COLORS.length),
  fixedColors:z.array(colorSchema).max(6),
  dimensions:z.string().trim().max(120).nullable(),
  weightGrams:nullableInt.refine(value=>value===null||value>=0),
  plasticWeightGrams:nullableInt.refine(value=>value===null||(value>=0&&value<=1_000_000)),
  leadTimeDays:z.number().int().min(0).max(365),
  featured:z.boolean(),
  active:z.boolean(),
  configurations:z.array(configurationSchema).min(1,"Добавьте хотя бы одну комплектацию").max(20),
  imageUrls:z.array(z.string().trim().regex(safeImagePath,"Недопустимый адрес изображения").max(800)).min(1,"Добавьте хотя бы одно изображение").max(8),
  modelSourceUrl:z.string().trim().max(800),
}).superRefine((data,context)=>{
  if(!data.categoryIds.includes(data.categoryId))context.addIssue({code:z.ZodIssueCode.custom,path:["categoryIds"],message:"Основная категория должна быть выбрана"});
  if(data.colorSelectable&&data.selectableColors.length===0)context.addIssue({code:z.ZodIssueCode.custom,path:["selectableColors"],message:"Выберите хотя бы один доступный цвет"});
  if(!data.colorSelectable&&data.fixedColors.length===0)context.addIssue({code:z.ZodIssueCode.custom,path:["fixedColors"],message:"Выберите цвета изделия"});
  const names=new Set<string>();
  data.configurations.forEach((configuration,index)=>{if(names.has(configuration.name))context.addIssue({code:z.ZodIssueCode.custom,path:["configurations",index],message:"Комплектация с таким названием уже добавлена"});names.add(configuration.name)});
});

export type AdminProductInput=z.infer<typeof adminProductSchema>;
