import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_NAME, COMMUNITY_ADDRESS_LINE } from "@/lib/branding";
import type { NewsletterItemInput } from "@/app/actions/newsletter";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

interface NewsletterPrintPageProps {
    params: Promise<{ id: string }>;
}

function parseItems(raw: unknown): NewsletterItemInput[] {
    if (!Array.isArray(raw)) return [];
    return raw as NewsletterItemInput[];
}

export default async function NewsletterPrintPage({ params }: NewsletterPrintPageProps) {
    await requireAdminOrRedirect();
    const { id } = await params;

    const newsletter = await prisma.newsletter.findUnique({ where: { id } });
    if (!newsletter) {
        notFound();
    }

    const items = parseItems(newsletter.items);

    return (
        <div className="min-h-screen bg-white py-10 px-6 print:p-0">
            <div className="max-w-2xl mx-auto space-y-8 print:max-w-none">
                <div className="text-center border-b-2 border-amber-800 pb-4 space-y-1">
                    <h1 className="text-xl font-bold text-amber-900">{COMMUNITY_NAME}</h1>
                    <h2 className="text-lg font-semibold text-slate-800">{newsletter.subject}</h2>
                </div>

                <div className="space-y-6">
                    {items.map((item, index) => (
                        <div key={index} className="space-y-1.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                                {item.category}
                            </span>
                            <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                            <p className="text-sm text-slate-700 leading-relaxed">{item.body}</p>
                            {item.imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element -- print output, next/image optimization is irrelevant here
                                <img src={item.imageUrl} alt={item.title} className="max-w-full rounded-lg mt-1" />
                            )}
                        </div>
                    ))}
                </div>

                <div className="text-center text-xs text-slate-400 border-t border-slate-200 pt-4">
                    {COMMUNITY_NAME} • {COMMUNITY_ADDRESS_LINE}
                </div>

                <div className="text-center print:hidden">
                    <PrintButton />
                </div>
            </div>
        </div>
    );
}
