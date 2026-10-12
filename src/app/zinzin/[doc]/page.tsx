import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LEGAL_DOCS, LEGAL_UPDATED_AT, type LegalDocId } from "@/lib/legal/zinzin";

// Pages légales publiques de l'app Zinzin (URL à déclarer sur l'App Store / Google Play).
const IDS = Object.keys(LEGAL_DOCS) as LegalDocId[];

export function generateStaticParams() {
  return IDS.map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const d = LEGAL_DOCS[doc as LegalDocId];
  return { title: d ? `${d.title} · Zinzin` : "Zinzin", robots: { index: true } };
}

export default async function ZinzinLegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = LEGAL_DOCS[doc as LegalDocId];
  if (!d) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 pb-20 pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] text-white">
      <p className="text-sm font-semibold text-white/50">Zinzin</p>
      <h1 className="mt-1 text-4xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{d.title}</h1>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {IDS.map((id) => (
          <Link key={id} href={`/zinzin/${id}`}
                className={`rounded-full px-3 py-1.5 ${id === d.id ? "bg-white text-[#15082E]" : "bg-white/10 text-white/80"}`}>
            {LEGAL_DOCS[id].title}
          </Link>
        ))}
      </nav>
      {d.intro && <p className="mt-6 text-base leading-7 text-white/85">{d.intro}</p>}
      {d.sections.map((s) => (
        <section key={s.title} className="mt-8">
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{s.title}</h2>
          {s.paragraphs.map((p, i) => (
            <p key={i} className="mt-3 text-[15px] leading-7 text-white/75">{p}</p>
          ))}
        </section>
      ))}
      <p className="mt-12 text-xs text-white/40">Dernière mise à jour : {LEGAL_UPDATED_AT}</p>
    </main>
  );
}
