"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {CART_EVENT,CART_KEY,cartCount} from "@/lib/cart-client";

export function CartLink(){
  const [count,setCount]=useState(0),[bump,setBump]=useState(false);
  useEffect(()=>{
    const update=()=>{setCount(cartCount());setBump(true);const timer=window.setTimeout(()=>setBump(false),420);return ()=>window.clearTimeout(timer)};
    const storage=(event:StorageEvent)=>{if(event.key===CART_KEY)update()};
    update();window.addEventListener(CART_EVENT,update);window.addEventListener("storage",storage);
    return ()=>{window.removeEventListener(CART_EVENT,update);window.removeEventListener("storage",storage)};
  },[]);
  return <Link className={`pill cart-link${bump?" cart-link-bump":""}`} href="/cart"><span>Корзина</span>{count>0&&<b className="cart-count" aria-label={`${count} товаров в корзине`}>{count>99?"99+":count}</b>}</Link>
}
