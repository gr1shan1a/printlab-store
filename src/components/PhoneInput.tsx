"use client";
import {formatRussianPhone} from "@/lib/phone";

export function PhoneInput({value,onChange,required=false,name="phone"}:{value:string;onChange:(value:string)=>void;required?:boolean;name?:string}){
  return <input name={name} type="tel" inputMode="tel" autoComplete="tel" required={required} value={value} onChange={event=>onChange(formatRussianPhone(event.target.value))} onFocus={()=>{if(!value)onChange("+7")}} placeholder="+7 (999) 000-00-00" maxLength={18}/>;
}
