import {db} from "@/lib/db";
import {AdminProductManager} from "@/components/AdminProductManager";

export default async function Products(){
  const [rows,categories]=await Promise.all([
    db.product.findMany({include:{categories:true,images:{orderBy:{position:"asc"}},variants:{where:{active:true},orderBy:{id:"asc"}}},orderBy:{createdAt:"desc"}}),
    db.category.findMany({orderBy:{sortOrder:"asc"}}),
  ]);
  const products=rows.map(product=>{
    const configurations=new Map<string,{name:string;priceInKopecks:number;stock:number}>();
    product.variants.forEach(variant=>{const name=variant.configuration||variant.size||"Стандартная";if(!configurations.has(name))configurations.set(name,{name,priceInKopecks:variant.priceInKopecks,stock:variant.stock})});
    const selectableColors=product.colorSelectable?[...new Set(product.variants.map(variant=>variant.color))]:[];
    return {...product,createdAt:undefined,updatedAt:undefined,archivedAt:product.archivedAt?.toISOString()||null,imageUrls:product.images.map(image=>image.url),configurations:[...configurations.values()],selectableColors,categoryIds:[product.categoryId,...product.categories.map(category=>category.id)],images:undefined,variants:undefined};
  });
  return <AdminProductManager products={products} categories={categories}/>;
}
