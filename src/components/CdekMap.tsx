"use client";

import {useEffect,useRef} from "react";

export type CdekOffice = {
  code: string;
  name: string;
  type: string;
  city: string;
  cityCode: number;
  address: string;
  latitude: number;
  longitude: number;
  workTime: string;
};

type YMapInstance={setCenter:(center:number[],zoom?:number)=>void;geoObjects:{add:(object:unknown)=>void;removeAll:()=>void};destroy:()=>void;container:{fitToViewport:()=>void}};
type YMapsApi={ready:(callback:()=>void)=>void;Map:new(element:HTMLElement,state:{center:number[];zoom:number},options?:Record<string,unknown>)=>YMapInstance;Placemark:new(coords:number[],properties?:Record<string,unknown>,options?:Record<string,unknown>)=>{events:{add:(event:string,callback:()=>void)=>void}}};
declare global {interface Window{ymaps?:YMapsApi;__cdekYmapsPromise?:Promise<YMapsApi>}}

function loadYandexMaps(apiKey:string):Promise<YMapsApi>{
  if(window.ymaps)return Promise.resolve(window.ymaps);
  if(window.__cdekYmapsPromise)return window.__cdekYmapsPromise;
  window.__cdekYmapsPromise=new Promise((resolve,reject)=>{
    const script=document.createElement("script");
    script.src=`https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.async=true;
    script.onload=()=>window.ymaps?.ready(()=>window.ymaps&&resolve(window.ymaps));
    script.onerror=()=>reject(new Error("Не удалось загрузить Яндекс Карты"));
    document.head.appendChild(script);
  });
  return window.__cdekYmapsPromise;
}

export default function CdekMap({offices,selected,onSelect}:{cityCode:number;offices:CdekOffice[];selected:CdekOffice|null;onSelect:(office:CdekOffice)=>void}){
  const containerRef=useRef<HTMLDivElement|null>(null);
  const mapRef=useRef<YMapInstance|null>(null);
  const onSelectRef=useRef(onSelect);
  const apiKey=process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY||"";
  useEffect(()=>{onSelectRef.current=onSelect},[onSelect]);

  useEffect(()=>{
    const container=containerRef.current;
    if(!container||!apiKey)return;
    let disposed=false;
    let map:YMapInstance|null=null;
    void loadYandexMaps(apiKey).then(ymaps=>{
      if(disposed)return;
      const located=offices.filter(office=>Number.isFinite(office.latitude)&&Number.isFinite(office.longitude)&&office.latitude!==0&&office.longitude!==0);
      const center=selected?[selected.latitude,selected.longitude]:located.length?[located.reduce((sum,office)=>sum+office.latitude,0)/located.length,located.reduce((sum,office)=>sum+office.longitude,0)/located.length]:[55.768005,37.615655];
      map=new ymaps.Map(container,{center,zoom:selected?16:11},{controls:["zoomControl"],suppressMapOpenBlock:true});
      mapRef.current=map;
      for(const office of located){
        const isSelected=office.code===selected?.code;
        const marker=new ymaps.Placemark([office.latitude,office.longitude],{iconCaption:office.code},{preset:isSelected?"islands#redCircleDotIcon":"islands#blueCircleDotIcon",iconCaptionMaxWidth:90});
        marker.events.add("click",()=>onSelectRef.current(office));
        map.geoObjects.add(marker);
      }
    }).catch(()=>{if(!disposed&&container)container.dataset.mapError="true"});
    return()=>{disposed=true;map?.destroy();if(mapRef.current===map)mapRef.current=null};
  },[apiKey,offices,selected]);

  if(!apiKey)return <div className="cdek-map cdek-map-unavailable"><strong>Для интерактивной карты нужен ключ Яндекс Maps API</strong><span>После добавления ключа метки ПВЗ станут кликабельными. Пока пункт можно выбрать в списке рядом.</span></div>;
  return <div className="cdek-map-shell"><div ref={containerRef} className="cdek-map" role="application" aria-label={`Карта пунктов выдачи СДЭК${offices[0]?.city?` · ${offices[0].city}`:""}`}/></div>;
}
