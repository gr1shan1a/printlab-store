"use client";
import {ColorSwatch,MultiColorSwatch} from "@/components/ColorSwatch";
import {PRODUCT_COLORS} from "@/lib/product-colors";

export type EditableConfiguration={name:string;priceInKopecks:number;stock:number};

export function ProductVariantManager({configurations,colorSelectable,selectableColors,fixedColors,onConfigurationsChange,onColorModeChange,onSelectableColorsChange,onFixedColorsChange}:{configurations:EditableConfiguration[];colorSelectable:boolean;selectableColors:string[];fixedColors:string[];onConfigurationsChange:(configurations:EditableConfiguration[])=>void;onColorModeChange:(selectable:boolean)=>void;onSelectableColorsChange:(colors:string[])=>void;onFixedColorsChange:(colors:string[])=>void}){
  const activeColors=colorSelectable?selectableColors:fixedColors;
  function update(index:number,patch:Partial<EditableConfiguration>){onConfigurationsChange(configurations.map((configuration,i)=>i===index?{...configuration,...patch}:configuration))}
  function add(){const last=configurations.at(-1);onConfigurationsChange([...configurations,{name:"Новая комплектация",priceInKopecks:last?.priceInKopecks||0,stock:last?.stock||0}])}
  function remove(index:number){if(configurations.length>1)onConfigurationsChange(configurations.filter((_,i)=>i!==index))}
  function toggleColor(color:string){const next=activeColors.includes(color)?activeColors.filter(value=>value!==color):[...activeColors,color];if(colorSelectable)onSelectableColorsChange(next);else onFixedColorsChange(next)}
  const combinations=colorSelectable?configurations.length*selectableColors.length:configurations.length;
  return <section className="variant-manager">
    <div className="variant-manager-head"><div><b>Комплектации и цены</b><small>Цвета и комплектации автоматически объединяются во все варианты.</small></div><button type="button" className="btn" onClick={add}>+ Добавить комплектацию</button></div>
    <div className="color-mode"><b>Как используются цвета?</b><div className="segmented"><button type="button" className={colorSelectable?"active":""} onClick={()=>onColorModeChange(true)}>Покупатель выбирает цвет</button><button type="button" className={!colorSelectable?"active":""} onClick={()=>onColorModeChange(false)}>Фиксированные цвета изделия</button></div></div>
    <div className="fixed-color-picker"><span>{colorSelectable?"Отметьте цвета, доступные покупателю:":"Отметьте все цвета, используемые в изделии:"}</span><div className="color-checks">{PRODUCT_COLORS.map(color=><button type="button" key={color} className={activeColors.includes(color)?"active":""} onClick={()=>toggleColor(color)} aria-pressed={activeColors.includes(color)}><ColorSwatch color={color}/>{color}</button>)}</div>{activeColors.length>1&&<div className="combined-color-preview"><MultiColorSwatch colors={activeColors} size={34}/><small>{colorSelectable?`${activeColors.length} цветов для выбора`:`Так будет выглядеть цветовой круг`}</small></div>}</div>
    <div className="combination-count">Будет создано вариантов: <b>{combinations}</b> <small>({configurations.length} комплектаций × {colorSelectable?selectableColors.length:1} цветовых вариантов)</small></div>
    <div className="variant-list">{configurations.map((configuration,index)=><div className="variant-row configuration-row" key={index}><label className="field"><span>Комплектация</span><input value={configuration.name} placeholder="Например, с зарядкой" onChange={event=>update(index,{name:event.target.value})}/></label><label className="field"><span>Цена, ₽</span><input type="number" min="0" value={configuration.priceInKopecks/100} onChange={event=>update(index,{priceInKopecks:Math.round(Number(event.target.value)*100)})}/></label><label className="field"><span>Остаток</span><input type="number" min="0" value={configuration.stock} onChange={event=>update(index,{stock:Number(event.target.value)})}/></label><button type="button" className="remove-variant" onClick={()=>remove(index)} disabled={configurations.length===1} aria-label="Удалить комплектацию">×</button></div>)}</div>
  </section>
}
