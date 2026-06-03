import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="pb-10">
      <header className="bg-wine px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)] text-white">
        <div className="flex items-center gap-3">
          <button
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/15 ring-1 ring-white/25 transition-colors hover:bg-white/25"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <h1 className="font-display text-2xl font-semibold">Privacy Policy</h1>
        </div>
      </header>

      <div className="space-y-5 px-5 py-6 text-sm leading-relaxed text-ink">
        <p className="text-xs text-muted">Last updated: June 2026</p>

        <Section title="Overview">
          Franschhoek Local ("we", "the app") helps you discover events, deals and community in
          Franschhoek. This policy explains what we collect and why. By using the app you agree to it.
        </Section>

        <Section title="What we collect">
          <ul className="ml-4 list-disc space-y-1">
            <li>Account details you provide — your email and display name.</li>
            <li>A profile photo, if you choose to add one.</li>
            <li>Your activity in the app — events you save or RSVP to, and your membership tier.</li>
            <li>Messages you post in community chats.</li>
            <li>Basic technical data needed to run the service (e.g. device/session info).</li>
          </ul>
        </Section>

        <Section title="How we use it">
          To provide and personalise the app — signing you in, showing your saved/attending events,
          enabling community chat, sending you relevant notifications, and improving the service.
        </Section>

        <Section title="Service providers">
          <ul className="ml-4 list-disc space-y-1">
            <li><strong>Supabase</strong> — authentication, database and realtime chat hosting.</li>
            <li><strong>Anthropic (Claude)</strong> — powers the in-app help assistant; your questions are sent to generate answers.</li>
            <li><strong>Yoco</strong> — processes Premium subscription payments (when enabled).</li>
          </ul>
          We do not sell your personal information.
        </Section>

        <Section title="Notifications">
          With your permission, we send notifications about events, deals and chat activity. You can
          turn these off any time in your device settings or in Profile → Notifications.
        </Section>

        <Section title="Your choices">
          You can edit your profile, sign out, or request deletion of your account and associated data
          by contacting us. Disabling notifications stops future alerts.
        </Section>

        <Section title="Contact">
          Questions about your privacy? Email <strong>support@franschhoeklocal.app</strong>.
        </Section>

        <p className="text-xs text-muted">
          This is a starter policy — have it reviewed for your jurisdiction (POPIA / GDPR) before
          publishing to the app stores.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 font-display text-lg font-semibold text-ink">{title}</h2>
      <div className="text-muted">{children}</div>
    </section>
  );
}
