"use client";
import Image from "next/image";
import {useMemo,useState} from "react";
import {AddToCart} from "@/components/AddToCart";
import {ColorSwatch,MultiColorSwatch} from "@/components/ColorSwatch";
import {money} from "@/lib/money";
import {PRODUCT_COLORS} from "@/lib/product-colors";

type Variant={id:string;sku:string;configuration:string|null;color:string;material:string;priceInKopecks:number;stock:number;reserved:number;imageUrl:string|null};
type GalleryImage={url:string;alt:string};
type ConfigurableProduct={name:string;sku:string;shortDescription:string;description:string;category:string;leadTimeDays:number;modelSourceUrl:string|null;dimensions:string|null;weightGrams:number|null;colorSelectable:boolean;fixedColors:string[];images:GalleryImage[];variants:Variant[]};

export function ProductConfigurator({product}:{product:ConfigurableProduct}){
  const variants=product.variants;
  const configurations=[...new Set(variants.map(variant=>variant.configuration||"Стандартная"))];
  const [configuration,setConfiguration]=useState(configurations[0]||"Стандартная");
  const initial=variants.find(variant=>(variant.configuration||"Стандартная")===configuration)||variants[0];
  const [color,setColor]=useState(initial?.color||"");
  const [manualImage,setManualImage]=useState<string|null>(null);
  const availableForConfiguration=variants.filter(variant=>(variant.configuration||"Стандартная")===configuration).sort((left,right)=>PRODUCT_COLORS.indexOf(left.color as (typeof PRODUCT_COLORS)[number])-PRODUCT_COLORS.indexOf(right.color as (typeof PRODUCT_COLORS)[number]));
  const selected=useMemo(()=>availableForConfiguration.find(variant=>!product.colorSelectable||variant.color===color)||availableForConfiguration[0]||variants[0],[availableForConfiguration,color,product.colorSelectable,variants]);
  if(!selected)return null;
  const available=selected.stock-selected.reserved;
  const shownImage=manualImage||selected.imageUrl||product.images[0]?.url;
  function chooseConfiguration(value:string){setConfiguration(value);const options=variants.filter(variant=>(variant.configuration||"Стандартная")===value).sort((left,right)=>PRODUCT_COLORS.indexOf(left.color as (typeof PRODUCT_COLORS)[number])-PRODUCT_COLORS.indexOf(right.color as (typeof PRODUCT_COLORS)[number])),sameColor=options.find(variant=>variant.color===color);setColor(sameColor?.color||options[0]?.color||"");setManualImage(null)}
  const displayVariantLabel=[configuration!=="Стандартная"?configuration:null,selected.sku].filter(Boolean).join(" · ");
  const cartVariantLabel=[configuration!=="Стандартная"?configuration:null,product.colorSelectable?selected.color:product.fixedColors.join(" + ")].filter(Boolean).join(" · ");
  return <div className="container detail configurator">
    <div><div className="detail-art config-image">{shownImage?<Image src={shownImage} alt={product.name} fill priority sizes="(max-width: 900px) 100vw, 55vw" style={{objectFit:"cover"}}/>:<div className="shape"/>}</div>{product.images.length>1&&<div className="variant-strip">{product.images.map(image=><button type="button" key={image.url} className={shownImage===image.url?"active":""} onClick={()=>setManualImage(image.url)}><Image src={image.url} alt={image.alt||product.name} fill sizes="96px" style={{objectFit:"cover"}}/></button>)}</div>}</div>
    <div><div className="eyebrow">{product.category} · {product.sku}</div><h2 style={{marginTop:15}}>{product.name}</h2><p className="lead">{product.shortDescription}</p>
      {(configurations.length>1||configurations[0]!=="Стандартная")&&<div className="config-block"><b>Комплектация</b><div className="config-options configuration-options">{configurations.map(value=>{const price=Math.min(...variants.filter(variant=>(variant.configuration||"Стандартная")===value).map(variant=>variant.priceInKopecks));return <button type="button" key={value} className={configuration===value?"active":""} onClick={()=>chooseConfiguration(value)}><span>{value}</span><small>{money(price)}</small></button>})}</div></div>}
      {product.colorSelectable?<div className="config-block"><b>Цвет печати</b><div className="color-circle-options">{availableForConfiguration.map(variant=><button type="button" key={variant.id} className={variant.color===selected.color?"active":""} onClick={()=>{setColor(variant.color);setManualImage(null)}} aria-label={`Выбрать цвет: ${variant.color}`}><ColorSwatch color={variant.color} size={34}/></button>)}</div></div>:<div className="config-block"><b>Цвета изделия</b><div className="fixed-product-colors"><MultiColorSwatch colors={product.fixedColors}/></div></div>}
      <div className="config-total"><span>Ваш вариант<small>{displayVariantLabel}</small></span><strong>{money(selected.priceInKopecks)}</strong></div><p className={available>0?"notice":"notice error"}>{available>0?`В наличии: ${available} шт.`:`Под заказ · ${product.leadTimeDays}–${product.leadTimeDays+2} дня`}</p><p>{product.description}</p>
      <table><tbody><tr><td>Материал</td><td>{selected.material}</td></tr>{product.dimensions&&<tr><td>Размеры</td><td>{product.dimensions}</td></tr>}{product.weightGrams&&<tr><td>Вес</td><td>{product.weightGrams} г</td></tr>}<tr><td>Изготовление</td><td>{product.leadTimeDays}–{product.leadTimeDays+2} дня</td></tr>{product.modelSourceUrl&&<tr><td>Исходная модель</td><td><a href={product.modelSourceUrl} target="_blank" rel="noreferrer">Открыть проект ↗</a></td></tr>}</tbody></table>
      <div className="actions"><AddToCart available={available} item={{variantId:selected.id,name:product.name,variant:cartVariantLabel,priceInKopecks:selected.priceInKopecks}}/></div>
    </div>
  </div>
}
