export const CART_KEY="printlab_cart";
export const CART_EVENT="printlab:cart";

export type CartItem={variantId:string;name:string;variant:string;priceInKopecks:number;quantity:number};

function validItem(value:unknown):value is CartItem{
  if(!value||typeof value!=="object")return false;
  const item=value as Record<string,unknown>;
  return typeof item.variantId==="string"&&item.variantId.length<=64&&typeof item.name==="string"&&item.name.length<=200&&typeof item.variant==="string"&&item.variant.length<=300&&Number.isInteger(item.priceInKopecks)&&Number(item.priceInKopecks)>=0&&Number.isInteger(item.quantity)&&Number(item.quantity)>=1&&Number(item.quantity)<=99;
}

export function readCart():CartItem[]{
  try{
    const parsed=JSON.parse(localStorage.getItem(CART_KEY)||"[]");
    return Array.isArray(parsed)?parsed.filter(validItem).slice(0,50):[];
  }catch{return []}
}

export function writeCart(items:CartItem[]){
  const safe=items.filter(validItem).slice(0,50);
  localStorage.setItem(CART_KEY,JSON.stringify(safe));
  window.dispatchEvent(new CustomEvent(CART_EVENT,{detail:{count:safe.reduce((sum,item)=>sum+item.quantity,0)}}));
}

export function cartCount(){return readCart().reduce((sum,item)=>sum+item.quantity,0)}
