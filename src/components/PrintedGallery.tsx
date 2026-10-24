"use client";

import Image from "next/image";

export type PrintedGalleryItem={id:string;imageUrl:string;caption:string;reference:string};

export function PrintedGallery({items}:{items:PrintedGalleryItem[]}){
  function choose(item:PrintedGalleryItem){window.dispatchEvent(new CustomEvent("choose-gallery-item",{detail:{reference:item.reference}}));document.getElementById("custom")?.scrollIntoView({behavior:"smooth"})}
  return <section className="container section printed-gallery"><div className="section-head"><div><div className="eyebrow">Уже напечатали</div><h2>Галерея работ.</h2></div><p className="lead">Понравилась работа? Выберите её как референс — мы рассчитаем индивидуальный заказ.</p></div>{items.length?<div className="gallery-grid">{items.map(item=><article className="gallery-card" key={item.id}><div className="gallery-image"><Image src={item.imageUrl} alt={item.caption} fill sizes="(max-width: 700px) 100vw, 33vw"/></div><div><h3>{item.caption}</h3><button type="button" className="btn" onClick={()=>choose(item)}>Хочу похожее</button></div></article>)}</div>:<div className="gallery-placeholder"><b>Здесь появятся напечатанные работы</b><span>Галерея уже подготовлена — фотографии можно будет добавить следующим этапом.</span></div>}</section>
}
