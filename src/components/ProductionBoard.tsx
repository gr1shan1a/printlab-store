"use client";

import {useEffect,useRef,useState} from "react";
import {statusLabel} from "@/lib/status";

type ProductionStatus="QUEUED"|"PRINTING"|"COMPLETED"|"FAILED";
type Row={id:string;orderNumber:number|null;requestName:string|null;productName:string;variantLabel:string;quantity:number;batchSize:number;printRuns:number;status:ProductionStatus};
const statuses:ProductionStatus[]=["QUEUED","PRINTING","COMPLETED","FAILED"];
const archived=(status:ProductionStatus)=>status==="COMPLETED"||status==="FAILED";

export function ProductionBoard({initialRows}:{initialRows:Row[]}){
  const [rows,setRows]=useState(initialRows),[view,setView]=useState<"active"|"archive">("active"),[busy,setBusy]=useState<string|null>(null),[error,setError]=useState(""),[lingering,setLingering]=useState<Record<string,"active"|"archive">>({});
  const timers=useRef<Map<string,ReturnType<typeof setTimeout>>>(new Map());
  useEffect(()=>()=>{timers.current.forEach(clearTimeout);timers.current.clear()},[]);
  const visible=rows.filter(row=>(view==="archive"?archived(row.status):!archived(row.status))||lingering[row.id]===view);

  async function change(id:string,status:ProductionStatus){
    setBusy(id);setError("");
    const response=await fetch(`/api/admin/production/${id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status})});
    setBusy(null);
    if(!response.ok){const body=await response.json().catch(()=>null);setError(body?.error||"Не удалось изменить статус");return}
    const oldStatus=rows.find(row=>row.id===id)?.status;
    setRows(current=>current.map(row=>row.id===id?{...row,status}:row));
    const previous=timers.current.get(id);if(previous)clearTimeout(previous);
    const moved=oldStatus!==undefined&&archived(oldStatus)!==archived(status);
    if(moved){const source=archived(oldStatus)?"archive":"active";setLingering(current=>({...current,[id]:source}));timers.current.set(id,setTimeout(()=>{setLingering(current=>{const next={...current};delete next[id];return next});timers.current.delete(id)},3000))}
  }

  return <><div className="eyebrow">Приоритет производства</div><div className="production-heading"><div><h2>{view==="active"?"Нужно напечатать":"Архив печати"}</h2><p className="muted">{view==="active"?"Завершённые и неудачные задачи исчезают через 3 секунды.":"Завершённые задачи и ошибки печати."}</p></div><div className="segmented production-switch"><button type="button" className={view==="active"?"active":""} onClick={()=>setView("active")}>Активные</button><button type="button" className={view==="archive"?"active":""} onClick={()=>setView("archive")}>Архив</button></div></div>{error&&<div className="notice error">{error}</div>}{visible.length?<div className="admin-table-wrap production-table-wrap"><table><thead><tr><th>Заказ / заявка</th><th>Изделие</th><th>Вариант / описание</th><th>Количество</th><th>Запуски</th><th>Статус</th></tr></thead><tbody>{visible.map(row=><tr key={row.id}><td>{row.orderNumber?`#${row.orderNumber}`:<><b>Заявка</b><small>{row.requestName}</small></>}</td><td>{row.productName}</td><td className="production-description">{row.variantLabel}</td><td>{row.quantity} шт.</td><td><b>{row.printRuns}</b><small>{row.batchSize>1?`по ${row.batchSize} шт. на платформе`:"по 1 шт."}</small></td><td><div className="production-status"><select disabled={busy===row.id} value={row.status} onChange={event=>change(row.id,event.target.value as ProductionStatus)}>{statuses.map(status=><option key={status} value={status}>{statusLabel[status]}</option>)}</select><small>{busy===row.id?"Сохраняю…":statusLabel[row.status]}</small></div></td></tr>)}</tbody></table></div>:<div className="empty"><h3>{view==="active"?"Очередь печати пуста":"В архиве пока ничего нет"}</h3></div>}</>;
}
