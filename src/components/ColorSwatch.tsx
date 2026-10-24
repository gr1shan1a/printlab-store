import {CSSProperties} from "react";

const COLOR_HEX:Record<string,string>={
  "Красный":"#e53935","Белый":"#ffffff","Чёрный":"#171717","Оранжевый":"#ff7900","Синий":"#2474e5","Зелёный":"#34a853","Жёлтый":"#f4cc27","Серый":"#9ca3af","Графит":"#4b5563","Песочный":"#d7bd8a","Бежевый":"#ead8b9","Коричневый":"#795548","Фиолетовый":"#8b5cf6","Розовый":"#ec78a6","Бирюзовый":"#24b8ad","Золотой":"#d4a72c","Серебристый":"#c5cad1","Прозрачный":"transparent","Натуральный":"#e7ddc7",
};

export function colorHex(color:string){return COLOR_HEX[color]||"#dddddd"}

export function ColorSwatch({color,size=22}:{color:string;size?:number}){const style={"--swatch-color":colorHex(color),width:size,height:size} as CSSProperties;return <span className={`color-swatch ${color==="Прозрачный"?"is-transparent":""}`} style={style} aria-hidden="true"/>}

export function MultiColorSwatch({colors,size=48}:{colors:string[];size?:number}){const safeColors=colors.length?colors:["Натуральный"],part=100/safeColors.length,background=safeColors.length===1?colorHex(safeColors[0]):`conic-gradient(${safeColors.map((color,index)=>`${colorHex(color)} ${index*part}% ${(index+1)*part}%`).join(",")})`;return <span className="color-swatch multi-color-swatch" role="img" aria-label={safeColors.join(", ")} style={{width:size,height:size,background}}/>}
