import Link from "next/link";
import { currentUser, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CartLink } from "@/components/CartLink";
import { MobileMenu } from "@/components/MobileMenu";

export async function Header() {
  const user = await currentUser();
  async function logout() {
    "use server";
    await destroySession();
    redirect("/");
  }
  const accountHref = user?.role === "ADMIN" ? "/admin" : "/account";
  const accountLabel = user?.name || user?.email || "Войти";

  return <header className="header"><div className="container header-in">
    <Link className="logo" href="/">FORM<i>3D</i></Link>
    <nav className="nav" aria-label="Основная навигация">
      <Link href="/catalog">Каталог</Link><Link href="/3d-pechat-na-zakaz">3D-печать на заказ</Link><Link href="/#process">Как это работает</Link><Link href="/contacts">Контакты</Link>
    </nav>
    <div className="tools">
      {user ? <><Link className="account" href={accountHref}>{user.name || "Кабинет"}</Link><form className="desktop-logout" action={logout}><button className="pill">Выйти</button></form></> : <Link className="account" href="/login">Войти</Link>}
      <div className="desktop-cart"><CartLink /></div>
      <MobileMenu accountHref={accountHref} accountLabel={accountLabel} logoutAction={user ? logout : undefined} />
    </div>
  </div></header>;
}
