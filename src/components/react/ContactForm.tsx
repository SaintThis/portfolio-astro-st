import { useState } from 'react';
import type { SubmitEvent } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Contact form island.
 *
 * Currently posts to `PUBLIC_API_BASE_URL/contact` when configured, otherwise
 * simulates success so the UX is complete before the backend exists. Swap the
 * `submit()` body for your real endpoint (or a service like Formspree/Resend).
 */
export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError('');

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    // Honeypot: bots fill hidden fields.
    if (data._gotcha) return setStatus('success');

    try {
      const base = import.meta.env.PUBLIC_API_BASE_URL;
      if (base) {
        const res = await fetch(`${base.replace(/\/$/, '')}/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
      } else {
        // No backend yet — simulate a round-trip.
        await new Promise((r) => setTimeout(r, 800));
      }
      setStatus('success');
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }

  const field =
    'w-full rounded-[var(--radius-box)] border border-border bg-surface px-4 py-3 font-mono text-sm text-fg placeholder:text-fg-faint transition-colors focus:border-accent focus:outline-none';

  if (status === 'success') {
    return (
      <div className="rounded-[var(--radius-box)] border border-success/40 bg-surface p-8 text-center">
        <div className="font-mono text-4xl text-success">✓</div>
        <h3 className="mt-3 text-xl font-bold">Message sent</h3>
        <p className="mt-2 text-sm text-fg-muted">
          Thanks for reaching out — I'll get back to you soon.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-5 font-mono text-sm text-accent hover:underline"
          data-cursor="hover"
        >
          ← send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {/* honeypot */}
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px]"
        aria-hidden="true"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block font-mono text-xs text-fg-muted">name</span>
          <input name="name" required placeholder="Ada Lovelace" className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-xs text-fg-muted">email</span>
          <input
            name="email"
            type="email"
            required
            placeholder="you@domain.dev"
            className={field}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block font-mono text-xs text-fg-muted">message</span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Tell me about the project…"
          className={`${field} resize-y`}
        />
      </label>

      {status === 'error' && (
        <p className="font-mono text-sm text-danger" role="alert">
          ✗ {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        data-cursor="hover"
        className="group inline-flex items-center gap-2 rounded-[var(--radius-box)] bg-accent px-6 py-3 font-mono text-sm font-medium text-accent-contrast transition-all hover:box-glow disabled:opacity-60"
      >
        {status === 'submitting' ? (
          <>
            <span className="inline-block animate-spin">◠</span> transmitting…
          </>
        ) : (
          <>
            send message <span className="transition-transform group-hover:translate-x-1">→</span>
          </>
        )}
      </button>
    </form>
  );
}
