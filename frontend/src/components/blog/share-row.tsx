"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  XIcon,
} from "@/components/brand/social-icons";

const socials = [
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
  { label: "Facebook", href: "https://facebook.com", Icon: FacebookIcon },
  { label: "X", href: "https://x.com", Icon: XIcon },
];

export function ShareRow() {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-coffee">Share</span>
      <div className="flex items-center gap-2">
        {socials.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-coffee transition hover:border-brand hover:bg-brand hover:text-white"
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}
        <button
          type="button"
          onClick={copyLink}
          aria-label="Copy link"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-coffee transition hover:border-brand hover:bg-brand hover:text-white"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
