import {db} from "@/lib/db";
import {CategoryManager} from "@/components/CategoryManager";
export default async function Categories(){const categories=await db.category.findMany({orderBy:{sortOrder:"asc"},include:{_count:{select:{products:true}}}});return <CategoryManager categories={categories.map(category=>({id:category.id,name:category.name,slug:category.slug,sortOrder:category.sortOrder,products:category._count.products}))}/>}
