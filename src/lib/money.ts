export const money=(kopecks:number)=>new Intl.NumberFormat("ru-RU",{style:"currency",currency:"RUB",maximumFractionDigits:0}).format(kopecks/100);
export const orderTotal=(items:{priceInKopecks:number;quantity:number}[])=>items.reduce((sum,item)=>sum+item.priceInKopecks*item.quantity,0);
