import {createHmac} from "crypto";
import bcrypt from "bcryptjs";

const COST=12;

function pepper(){
  const value=process.env.PASSWORD_PEPPER||"";
  if(process.env.NODE_ENV==="production"&&value.length<32)throw new Error("PASSWORD_PEPPER должен содержать минимум 32 символа");
  return value||"development-only-password-pepper";
}

function material(password:string){return createHmac("sha256",pepper()).update(password,"utf8").digest("base64")}

export function hashPassword(password:string){return bcrypt.hash(material(password),COST)}

export async function verifyPassword(password:string,hash:string){
  // The second comparison supports old bcrypt hashes and keeps account timing uniform.
  const [current,legacy]=await Promise.all([bcrypt.compare(material(password),hash),bcrypt.compare(password,hash)]);
  return {valid:current||legacy,needsUpgrade:legacy&&!current};
}
