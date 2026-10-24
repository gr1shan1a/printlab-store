import {z} from "zod";
import {PRODUCT_COLORS} from "@/lib/product-colors";
import {PLASTIC_TYPES} from "@/lib/plastic-options";

export const plasticMaterialSchema=z.object({
  name:z.string().trim().min(2,"Укажите название").max(120),
  type:z.enum(PLASTIC_TYPES),
  brand:z.string().trim().max(100).nullish().transform(value=>value??""),
  color:z.enum(PRODUCT_COLORS),
  diameterMm:z.number().positive().max(10),
  spoolWeightGrams:z.number().int().positive().max(100_000),
  priceInKopecks:z.number().int().min(0).max(100_000_000),
  unopenedSpools:z.number().int().min(0).max(10_000),
  remainingGrams:z.number().int().min(0).max(100_000),
  supplier:z.string().trim().max(160).nullish().transform(value=>value??""),
  notes:z.string().trim().max(1000).nullish().transform(value=>value??""),
}).superRefine((data,context)=>{if(data.remainingGrams>data.spoolWeightGrams)context.addIssue({code:z.ZodIssueCode.custom,path:["remainingGrams"],message:"Остаток открытой катушки не может быть больше веса катушки"})});

export const productPlasticUsageSchema=z.object({
  plasticWeightGrams:z.number().int().min(0).max(1_000_000).nullable(),
  plasticWastePercent:z.number().int().min(0).max(100),
  printMinutes100:z.number().int().min(0).max(100_000).nullable(),
  printMinutes166:z.number().int().min(0).max(100_000).nullable(),
  printBatchSize:z.number().int().min(1).max(10_000),
  usages:z.array(z.object({plasticMaterialId:z.string().min(1),grams:z.number().int().min(0).max(1_000_000)})).max(20),
}).superRefine((data,context)=>{const ids=new Set<string>();data.usages.forEach((usage,index)=>{if(ids.has(usage.plasticMaterialId))context.addIssue({code:z.ZodIssueCode.custom,path:["usages",index],message:"Этот пластик уже добавлен"});ids.add(usage.plasticMaterialId)})});

export const productionCostSettingsSchema=z.object({
  printerName:z.string().trim().min(2).max(100),
  purchasePriceKopecks:z.number().int().min(0).max(100_000_000),
  maintenanceKopecks:z.number().int().min(0).max(100_000_000),
  resourceHours:z.number().int().min(1).max(100_000),
  powerWatts:z.number().int().min(1).max(10_000),
  electricityKopecksKwh:z.number().int().min(0).max(100_000),
});
