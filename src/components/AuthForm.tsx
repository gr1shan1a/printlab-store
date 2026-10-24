"use client";

import {safeRedirectPath} from "@/lib/safe-redirect";
import {useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import Link from "next/link";
import {CaptchaField} from "@/components/CaptchaField";

export function AuthForm({mode}:{mode:"login"|"register"}){
  const [error,setError]=useState(""),[complete,setComplete]=useState(false),[captchaReset,setCaptchaReset]=useState(0),router=useRouter(),searchParams=useSearchParams();
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setError("");
    const data=Object.fromEntries(new FormData(event.currentTarget));
    if(mode==="register"&&data.password!==data.confirmPassword)return setError("Пароли не совпадают");
    const response=await fetch(`/api/auth/${mode}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)}),body=await response.json();
    if(!response.ok){setCaptchaReset(value=>value+1);return setError(body.error||"Ошибка входа")}
    if(mode==="register"){setComplete(true);return}
    const next=searchParams.get("next");router.push(safeRedirectPath(next));router.refresh();
  }
  if(complete)return <div className="auth form"><div className="eyebrow">Проверьте почту</div><h2>Остался один шаг</h2><p className="muted">Мы отправили ссылку для подтверждения аккаунта. Откройте письмо, чтобы завершить регистрацию.</p><p><Link href="/login">Перейти ко входу</Link></p></div>;
  return <form className="auth form" onSubmit={submit}><div><div className="eyebrow">{mode==="login"?"С возвращением":"Новый профиль"}</div><h2>{mode==="login"?"Войти":"Регистрация"}</h2></div><div className="field"><label>Email <i className="required-mark">*</i></label><input name="email" type="email" required autoComplete="email" maxLength={160}/></div>{mode==="register"&&<div className="field"><label>Имя <i className="required-mark">*</i></label><input name="name" required minLength={2} maxLength={80}/></div>}<div className="field"><label>Пароль <i className="required-mark">*</i></label><input name="password" type="password" required minLength={mode==="login"?1:10} maxLength={100} autoComplete={mode==="login"?"current-password":"new-password"}/></div>{mode==="register"&&<div className="field"><label>Подтвердите пароль <i className="required-mark">*</i></label><input name="confirmPassword" type="password" required minLength={10} maxLength={100} autoComplete="new-password"/></div>}<CaptchaField resetKey={captchaReset}/>{error&&<div className="notice error">{error}</div>}<button className="btn primary">{mode==="login"?"Войти":"Создать аккаунт"}</button><p className="muted">{mode==="login"?<>Нет аккаунта? <Link href="/register">Зарегистрироваться</Link></>:<>Уже есть аккаунт? <Link href="/login">Войти</Link></>}</p></form>
}
