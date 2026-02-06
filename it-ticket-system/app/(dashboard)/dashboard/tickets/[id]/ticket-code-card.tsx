'use client';

import { useState } from 'react';
import { Ticket, Copy, Check } from 'lucide-react';

interface TicketCodeCardProps {
  ticketCode: string;
}

export function TicketCodeCard({ ticketCode }: TicketCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <Ticket className="w-5 h-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wide">Ticket Code</p>
        <p className="font-mono text-sm font-bold text-slate-900 truncate">
          {ticketCode}
        </p>
      </div>
      <button
        onClick={copyToClipboard}
        className="p-2 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-slate-400" />
        )}
      </button>
    </div>
  );
}

