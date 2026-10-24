import { createHash } from "node:crypto";
import Link from "next/link";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (token && token.length <= 128) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const record = await db.emailVerificationToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (record && record.expiresAt > new Date()) {
      await db.$transaction([
        db.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
        db.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
      ]);
      await createSession(record.userId);
      redirect("/account?verified=1");
    }
  }
  return <div className="container section"><div className="empty"><div className="eyebrow">Подтверждение email</div><h1>Ссылка недействительна</h1><p className="muted">Возможно, срок ссылки истёк. Попробуйте зарегистрироваться ещё раз, чтобы получить новую.</p><Link className="btn primary" href="/register">Вернуться к регистрации</Link></div></div>;
}
