"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

const FAQ = [
  {
    q: "How do I send a payment?",
    a: "Go to Send payment, enter the amount, currency, recipient, and optional description. Add your card details (demo only—they are not stored). Click Send payment.",
  },
  {
    q: "How do I save a recipient?",
    a: "Go to Recipients and click Add recipient. Enter the name and optionally email or account number. You can then choose saved recipients when sending a payment.",
  },
  {
    q: "Where can I see my transaction history?",
    a: "Open Transactions to view all payments. Use filters by status, date range, or search by recipient or description. Click a row to see full transaction details.",
  },
  {
    q: "How do I request money from someone?",
    a: "Go to Request payment, enter the amount, currency, and the name of the person who should pay. They will receive a request (in a full implementation, by email or link). You can mark requests as paid when you receive the money.",
  },
  {
    q: "Is my data secure?",
    a: "This is a demo application. In production, we use encryption, secure authentication, and never store full card numbers. Enable two-factor authentication in Profile for extra security.",
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      <PageHeader
        title="Help & support"
        description="Frequently asked questions and how to get in touch."
        breadcrumbs={[{ label: "Help" }]}
      />
      <div className="max-w-3xl space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Frequently asked questions</h2>
          <ul className="space-y-2">
            {FAQ.map((item, i) => (
              <li key={i} className="border border-surface-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium text-white hover:bg-surface-800/50 transition-colors"
                >
                  {item.q}
                  <span className="flex-shrink-0 text-surface-400" aria-hidden>
                    {openIndex === i ? "−" : "+"}
                  </span>
                </button>
                {openIndex === i && (
                  <div className="px-4 pb-3 pt-0 text-surface-400 text-sm border-t border-surface-800/80">
                    {item.a}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Contact support</h2>
          <p className="text-surface-400 text-sm mb-4">
            For account or payment issues, contact our support team.
          </p>
          <a
            href="mailto:support@payflow.demo"
            className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm font-medium"
          >
            support@payflow.demo
          </a>
        </Card>
      </div>
    </>
  );
}
