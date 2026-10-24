import {db} from "@/lib/db";
import {ProductionQueue} from "@/components/ProductionQueue";
import {PrintConsole} from "@/components/PrintConsole";
import {listPrintLibrary} from "@/lib/print-library";

export default async function Production(){
  const [tasks,printFiles]=await Promise.all([db.productionTask.findMany({
    include:{orderItem:{include:{order:true,variant:{include:{product:true}}}},customRequest:true},
    orderBy:{id:"asc"},
  }),listPrintLibrary()]);
  const rows=tasks.map(task=>{const batchSize=task.orderItem?.variant.product.printBatchSize??1;return {id:task.id,orderNumber:task.orderItem?.order.number??null,requestName:task.customRequest?.name??null,productName:task.orderItem?.productName??(task.customRequest?.mode==="READY_MODEL"?"Печать по заявке":"Кастомная модель"),variantLabel:task.orderItem?.variantLabel??task.customRequest?.message??"Без описания",quantity:task.quantity,batchSize,printRuns:Math.ceil(task.quantity/batchSize),status:task.status,createdAt:(task.orderItem?.order.createdAt??task.customRequest?.createdAt??task.createdAt).toISOString(),printFileName:task.printFileName}});
  return <><PrintConsole initialFiles={printFiles}/><ProductionQueue initialRows={rows} files={printFiles}/></>;
}
