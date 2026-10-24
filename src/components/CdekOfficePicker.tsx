"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import CdekMap from "@/components/CdekMap";
import type {CdekOffice} from "@/components/CdekMap";
import type {CartItem} from "@/lib/cart-client";

type CdekCity={code:number;name:string;region:string;label:string};
const distance=(lat1:number,lon1:number,lat2:number,lon2:number)=>{const p=Math.PI/180,a=.5-Math.cos((lat2-lat1)*p)/2+Math.cos(lat1*p)*Math.cos(lat2*p)*(1-Math.cos((lon2-lon1)*p))/2;return 12742*Math.asin(Math.sqrt(a))};

export function CdekOfficePicker({items,onCostChange,onSelectedChange}:{items:CartItem[];onCostChange?:(cost:number|null)=>void;onSelectedChange?:(selected:boolean)=>void}){
  const [cityQuery,setCityQuery]=useState(""),[cities,setCities]=useState<CdekCity[]>([]),[city,setCity]=useState<CdekCity|null>(null),[cityLoading,setCityLoading]=useState(false),[cityError,setCityError]=useState("");
  const [offices,setOffices]=useState<CdekOffice[]>([]),[selected,setSelected]=useState<CdekOffice|null>(null),[query,setQuery]=useState(""),[officesLoading,setOfficesLoading]=useState(false),[officesError,setOfficesError]=useState(""),[message,setMessage]=useState(""),[cost,setCost]=useState<number|null>(null),[period,setPeriod]=useState<[number,number]|null>(null),[calculating,setCalculating]=useState(false);
  const calculationController=useRef<AbortController|null>(null);

  useEffect(()=>{
    if(cityQuery.trim().length<2){setCities([]);setCityError("");return}
    if(city&&cityQuery===city.label)return;
    const controller=new AbortController(),timer=setTimeout(async()=>{
      setCityLoading(true);setCityError("");
      try{
        const response=await fetch(`/api/cdek/cities?q=${encodeURIComponent(cityQuery.trim())}`,{signal:controller.signal}),body=await response.json();
        if(!response.ok)throw new Error(body.error||"Не удалось найти город");
        setCities(body.cities||[]);
      }catch(error){if(!controller.signal.aborted)setCityError(error instanceof Error?error.message:"Не удалось найти город")}
      finally{if(!controller.signal.aborted)setCityLoading(false)}
    },350);
    return()=>{clearTimeout(timer);controller.abort()};
  },[cityQuery,city]);

  useEffect(()=>{
    if(!city){setOffices([]);setSelected(null);setCost(null);onCostChange?.(null);onSelectedChange?.(false);return}
    const controller=new AbortController();
    setOfficesLoading(true);setOfficesError("");setOffices([]);setSelected(null);onSelectedChange?.(false);setCost(null);onCostChange?.(null);setPeriod(null);setQuery("");
    fetch(`/api/cdek/offices?cityCode=${city.code}`,{signal:controller.signal}).then(async response=>{
      const body=await response.json();if(!response.ok)throw new Error(body.error||"Не удалось загрузить пункты СДЭК");setOffices(body.offices||[]);
    }).catch(error=>{if(!controller.signal.aborted)setOfficesError(error instanceof Error?error.message:"Не удалось загрузить пункты СДЭК")}).finally(()=>{if(!controller.signal.aborted)setOfficesLoading(false)});
    return()=>controller.abort();
  },[city]);

  const shown=useMemo(()=>{const normalized=query.trim().toLocaleLowerCase("ru");return normalized?offices.filter(office=>`${office.name} ${office.address} ${office.code}`.toLocaleLowerCase("ru").includes(normalized)):offices},[offices,query]);

  async function chooseCity(value:CdekCity){setCity(value);setCityQuery(value.label);setCities([]);setCityError("");setMessage("")}
  async function selectOffice(office:CdekOffice){
    calculationController.current?.abort();const controller=new AbortController();calculationController.current=controller;
    setSelected(office);onSelectedChange?.(true);setCost(null);onCostChange?.(null);setPeriod(null);setMessage("");setCalculating(true);
    try{
      const response=await fetch("/api/cdek/calculate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({cityCode:office.cityCode,officeCode:office.code,items:items.map(item=>({variantId:item.variantId,quantity:item.quantity}))}),signal:controller.signal});
      const body=await response.json();if(!response.ok)throw new Error(body.error||"Не удалось рассчитать доставку");setCost(body.costInKopecks);onCostChange?.(body.costInKopecks);if(Number.isFinite(body.periodMin)&&Number.isFinite(body.periodMax))setPeriod([body.periodMin,body.periodMax]);
    }catch(error){if(!controller.signal.aborted)setMessage(error instanceof Error?error.message:"Не удалось рассчитать доставку")}
    finally{if(!controller.signal.aborted)setCalculating(false)}
  }
  function nearest(){
    setMessage("");if(!navigator.geolocation)return setMessage("Геолокация не поддерживается браузером");
    navigator.geolocation.getCurrentPosition(position=>{const sorted=[...offices].sort((a,b)=>distance(position.coords.latitude,position.coords.longitude,a.latitude,a.longitude)-distance(position.coords.latitude,position.coords.longitude,b.latitude,b.longitude));if(sorted[0]){void selectOffice(sorted[0]);setQuery(sorted[0].address)}},()=>setMessage("Не удалось определить местоположение. Найдите адрес в списке или на карте."),{enableHighAccuracy:false,timeout:8000,maximumAge:300000});
  }

  return <div className="cdek-picker">
    <label className="field"><span>Город доставки <i className="required-mark">*</i></span><input type="search" autoComplete="off" value={cityQuery} onChange={event=>{setCityQuery(event.target.value);setCity(null);setOfficesError("");setSelected(null);setCost(null)}} placeholder="Начните вводить город, например Санкт-Петербург"/></label>
    {cityLoading&&<div className="muted">Ищем город…</div>}
    {cities.length>0&&<div className="cdek-city-suggestions" role="listbox" aria-label="Города СДЭК">{cities.map(option=><button type="button" key={`${option.code}-${option.label}`} onClick={()=>void chooseCity(option)}><b>{option.name}</b>{option.region&&<small>{option.region}</small>}</button>)}</div>}
    {cityError&&<div className="notice error">{cityError}</div>}
    {city&&!cityLoading&&<>
      <input type="hidden" name="city" value={city.name}/>
      {officesLoading?<div className="cdek-map-loading" role="status"><span aria-hidden="true"/>Загружаем пункты выдачи в городе {city.label}…</div>:officesError?<div className="notice error">{officesError}</div>:offices.length===0?<div className="notice">В этом городе СДЭК не вернул пункты выдачи. Попробуйте выбрать другой город.</div>:<>
        <div className="cdek-picker-toolbar"><label className="field"><span>Найти ПВЗ</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Улица или код пункта"/></label><button className="btn" type="button" onClick={nearest}>◎ Ближайший ко мне</button></div>
        <div className="cdek-picker-layout"><CdekMap key={city.code} cityCode={city.code} offices={shown} selected={selected} onSelect={office=>void selectOffice(office)}/><div className="cdek-office-list">{shown.slice(0,50).map(office=><button type="button" key={office.code} className={selected?.code===office.code?"active":""} onClick={()=>void selectOffice(office)}><b>{office.address}</b><span>{office.name} · {office.code}</span><small>{office.workTime}</small></button>)}{!shown.length&&<div className="empty"><b>ПВЗ не найдены</b><span>Измените запрос</span></div>}</div></div>
        {selected?<div className="cdek-selected"><span>Выбран пункт</span><b>{selected.address}</b><small>{selected.name} · {selected.code} · {selected.workTime}</small>{calculating?<small>Рассчитываем ориентировочную стоимость доставки…</small>:cost!==null?<><strong>Примерная доставка: {(cost/100).toLocaleString("ru-RU",{style:"currency",currency:"RUB"})}</strong>{period&&<small>Обычный тариф СДЭК · ориентировочно {period[0]}–{period[1]} дн.</small>}<small>Стоимость доставки добавится к заказу и будет оплачена онлайн.</small></>:null}</div>:<div className="notice">Выберите пункт на карте или в списке.</div>}
        {message&&<div className="notice error">{message}</div>}
      </>}
      <input type="hidden" name="deliveryProvider" value="СДЭК"/><input type="hidden" name="deliveryPointCode" value={selected?.code||""}/><input type="hidden" name="deliveryCityCode" value={selected?.cityCode||""}/><input type="hidden" name="address" value={selected?.address||""}/>
    </>}
    {!city&&<div className="notice">Сначала выберите город — затем покажем карту и пункты выдачи в нём.</div>}
  </div>;
}
