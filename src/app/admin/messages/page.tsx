import { db } from "@/lib/db";
import { RequestWorkflow } from "@/components/RequestWorkflow";
import Link from "next/link";
export default async function Messages({searchParams}:{searchParams:Promise<{view?:string}>}) {
  const archive=(await searchParams).view==="archive",terminal=["COMPLETED","DECLINED"] as const;
  const [rows,activeCount,archiveCount] = await Promise.all([db.contactMessage.findMany({
    where:{workflowStatus:archive?{in:[...terminal]}:{notIn:[...terminal]}},
    orderBy: [{ workflowStatus: "asc" }, { createdAt: "asc" }],
  }),db.contactMessage.count({where:{workflowStatus:{notIn:[...terminal]}}}),db.contactMessage.count({where:{workflowStatus:{in:[...terminal]}}})]);
  return (
    <>
      <div className="eyebrow">Custom manufacturing</div>
      <div className="requests-heading"><div><h2>{archive?"Архив заявок":"Заявки на изготовление"}</h2><p className="muted">{archive?"Завершённые и отклонённые обращения.":"Проверка задачи, согласование модели и передача в общую очередь печати."}</p></div><div className="requests-count"><strong>{archive?archiveCount:activeCount}</strong><span>{archive?"в архиве":"активных"}</span></div></div>
      <div className="segmented requests-switch"><Link className={!archive?"active":""} href="/admin/messages">Активные · {activeCount}</Link><Link className={archive?"active":""} href="/admin/messages?view=archive">Архив · {archiveCount}</Link></div>
      <div className="request-board">
        {rows.map((x) => (
          <article className="request-card request-card-new" key={x.id}>
            <header><div><span className="badge-static">{x.mode === "READY_MODEL" ? "Только печать" : "Разработка модели"}</span><h3>{x.name}</h3></div><div className="request-quantity"><strong>{x.quantity || 1}</strong><span>шт.</span></div></header>
            <div className="request-meta"><span>Создана<b>{x.createdAt.toLocaleString("ru-RU")}</b></span><span>Email<b><a href={`mailto:${x.email||x.contact}`}>{x.email||x.contact}</a></b></span><span>Телефон<b>{x.phone?<a href={`tel:${x.phone}`}>{x.phone}</a>:"Не указан"}</b></span></div>
            <div className="request-brief"><small>Задача</small><p>{x.message}</p></div>
            {x.modelUrl&&<a className="request-reference" href={x.modelUrl} target="_blank" rel="noreferrer">Открыть готовую модель ↗</a>}
            {x.reference&&<div className="request-reference"><small>Референсы</small><span>{x.reference}</span></div>}
            <RequestWorkflow
              id={x.id}
              status={x.workflowStatus}
              promisedDays={x.promisedDays}
              mode={x.mode}
            />
          </article>
        ))}
      </div>
    </>
  );
}
