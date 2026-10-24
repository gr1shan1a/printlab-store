"use client";
import Image from "next/image";
import {useState} from "react";

type GalleryImage={url:string;alt:string};

export function ProductGallery({images,name}:{images:GalleryImage[];name:string}){
  const [selected,setSelected]=useState(0),image=images[selected];
  return <div className="product-gallery"><div className="detail-art gallery-main">{image?<Image src={image.url} alt={image.alt||name} fill priority sizes="(max-width: 900px) 100vw, 55vw" style={{objectFit:"cover"}}/>:<div className="shape"/>}</div>{images.length>1&&<div className="gallery-thumbnails">{images.map((item,index)=><button type="button" key={item.url} className={index===selected?"active":""} onClick={()=>setSelected(index)} aria-label={`Показать фото ${index+1}`}><Image src={item.url} alt="" fill sizes="96px" style={{objectFit:"cover"}}/></button>)}</div>}</div>
}
