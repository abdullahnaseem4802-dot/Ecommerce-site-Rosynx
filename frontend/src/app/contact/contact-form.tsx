"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const inputClass =
  "w-full rounded-xl border border-line bg-cream-soft px-4 py-3 text-sm text-coffee outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const user = useAuth((s) => s.user);

  // Prefill the logged-in user's email — only while the field is still empty,
  // so we never clobber what the visitor has typed.
  useEffect(() => {
    if (user?.email) setEmail((cur) => cur || user.email);
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setStatus("error");
      setError("Please enter your name.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setStatus("error");
      setError("Please enter a valid email address.");
      return;
    }
    if (!message.trim()) {
      setStatus("error");
      setError("Please enter a message.");
      return;
    }

    setStatus("submitting");
    setError("");
    try {
      await api.sendContact({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || undefined,
        message: message.trim(),
      });
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line/60 bg-white p-10 text-center">
        <p className="font-serif text-xl font-semibold text-espresso">
          Message sent
        </p>
        <p className="text-sm text-coffee/80">
          Thanks — we&apos;ll reply within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-line/60 bg-white p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-coffee">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-coffee">Email</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-coffee">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="How can we help?"
          className="w-full rounded-xl border border-line bg-cream-soft px-4 py-3 text-sm focus:border-brand focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-coffee">Message</label>
        <textarea
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message..."
          className={`${inputClass} resize-none`}
        />
      </div>
      {status === "error" && (
        <p className="text-sm font-medium text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {status === "submitting" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
