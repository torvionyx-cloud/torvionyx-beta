// @ts-nocheck

"use client";

/**
 * app/dashboard/settings/page.tsx
 *
 * Account settings — the Account tab of the settings area (Branding lives at
 * /dashboard/settings/brand, see SettingsTabs). Profile, email, and password
 * changes go straight through Clerk client-side (user.update(),
 * user.setProfileImage(), useClerk().openUserProfile()) — there's no app
 * database table for any of that, Clerk already owns it.
 *
 * "Proposal reply-to" has no backing column anywhere in brand_settings, so
 * it's stored in Clerk's unsafeMetadata rather than inventing a migration
 * for this one field — same "no custom backend needed" shape as the rest of
 * this section.
 *
 * Plan & billing, data export, and account deletion are all pre-payments
 * placeholders: the plan cards are inert, and export/delete both call real
 * endpoints (/api/account/export, /api/account/delete) that currently
 * return 501 — so the UI fails honestly instead of silently doing nothing.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { SettingsTabs } from "@/components/dashboard/SettingsTabs";

const PLANS = [
  { name: "Rise", price: "£12", period: "/mo", desc: "For solo operators sending a handful of proposals a month." },
  { name: "Strike", price: "£16", period: "/mo", desc: "For freelancers who send proposals every week and want the full toolkit." },
  { name: "Reign", price: "£20", period: "/mo", desc: "For established studios who want every feature, unlocked." },
];

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "email", label: "Email" },
  { id: "password", label: "Password" },
  { id: "plan", label: "Plan & billing" },
  { id: "data", label: "Your data" },
  { id: "access", label: "Account access" },
];

function detectCountry(): string | null {
  try {
    const locale = new Intl.Locale(navigator.language);
    const region = locale.region;
    if (!region) return null;
    return new Intl.DisplayNames(["en"], { type: "region" }).of(region) ?? region;
  } catch {
    return null;
  }
}

export default function AccountSettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [nameSaveState, setNameSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [replyTo, setReplyTo] = useState(
    (user?.unsafeMetadata?.replyToEmail as string | undefined) ?? ""
  );
  const [replyToSaveState, setReplyToSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [exportState, setExportState] = useState<"idle" | "loading" | "error">("idle");
  const [exportError, setExportError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteState, setDeleteState] = useState<"idle" | "loading" | "error">("idle");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const country = useMemo(() => (typeof window !== "undefined" ? detectCountry() : null), []);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    try {
      await user.setProfileImage({ file });
    } catch (err) {
      console.error("[settings] Avatar upload failed:", err);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [user]);

  const handleSaveName = useCallback(async () => {
    if (!user) return;
    setNameSaveState("saving");
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
      setNameSaveState("saved");
      setTimeout(() => setNameSaveState("idle"), 2500);
    } catch (err) {
      console.error("[settings] Name update failed:", err);
      setNameSaveState("error");
    }
  }, [user, firstName, lastName]);

  const handleSaveReplyTo = useCallback(async () => {
    if (!user) return;
    setReplyToSaveState("saving");
    try {
      await user.update({
        unsafeMetadata: { ...user.unsafeMetadata, replyToEmail: replyTo.trim() },
      });
      setReplyToSaveState("saved");
      setTimeout(() => setReplyToSaveState("idle"), 2500);
    } catch (err) {
      console.error("[settings] Reply-to update failed:", err);
      setReplyToSaveState("error");
    }
  }, [user, replyTo]);

  const handleExport = useCallback(async () => {
    setExportState("loading");
    setExportError(null);
    try {
      const res = await fetch("/api/account/export", { method: "POST" });
      if (res.status === 501) {
        setExportError("Data export isn't available yet.");
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setExportError(data.error || "Something went wrong.");
      }
    } catch {
      setExportError("Connection error — please try again.");
    } finally {
      setExportState("idle");
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleteState("loading");
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (res.status === 501) {
        setDeleteError("Account deletion isn't available yet.");
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || "Something went wrong.");
      } else {
        setDeleteOpen(false);
      }
    } catch {
      setDeleteError("Connection error — please try again.");
    } finally {
      setDeleteState("idle");
    }
  }, [deleteConfirmText]);

  const handleLogout = useCallback(async () => {
    await signOut();
    router.push("/sign-in");
  }, [signOut, router]);

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const isVerified = user?.primaryEmailAddress?.verification?.status === "verified";
  // Not every Clerk plan/version surfaces a password-changed timestamp on the
  // client User resource — only render this line when one is actually there,
  // rather than fabricate it.
  const passwordChangedAt = (user as any)?.passwordLastUpdatedAt ?? null;
  const passwordChangedLabel = passwordChangedAt
    ? formatMonthsAgo(new Date(passwordChangedAt))
    : null;

  if (!isLoaded) {
    return <div style={{ padding: 40, color: "var(--tv-text-faint)", fontSize: 13 }}>Loading…</div>;
  }

  return (
    <div>
      <SettingsTabs />

      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "'Space Grotesk',sans-serif",
          fontWeight: 600, fontSize: 22,
          color: "var(--tv-text)", letterSpacing: "-.02em"
        }}>
          Account settings
        </h1>
        <p style={{ marginTop: 4, fontSize: 13, color: "var(--tv-text-faint)" }}>
          Manage your profile, sign-in, and account.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 32, alignItems: "start" }}>
        {/* ── Main column ── */}
        <div style={{ display: "flex", flexDirection: "column" }}>

          {/* PROFILE */}
          <Panel id="profile" title="Profile">
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                  cursor: "pointer", overflow: "hidden", position: "relative",
                  border: "1.5px solid var(--tv-border)",
                  background: "var(--tv-panel-accent)",
                }}
                title="Change avatar"
              >
                {user?.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                {avatarUploading && (
                  <div style={{
                    position: "absolute", inset: 0, background: "rgba(10,19,34,.5)",
                    display: "grid", placeItems: "center", fontSize: 10, color: "#fff",
                  }}>
                    …
                  </div>
                )}
              </div>
              <div>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  style={ghostButtonStyle}>
                  Upload photo
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
                <p style={{ marginTop: 6, fontSize: 11.5, color: "var(--tv-text-faint)" }}>JPG or PNG, square works best.</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div>
                <Label>First name</Label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  onBlur={handleSaveName} maxLength={100} style={inputStyle} />
              </div>
              <div>
                <Label>Last name</Label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                  onBlur={handleSaveName} maxLength={100} style={inputStyle} />
              </div>
            </div>
            {nameSaveState === "saved" && <p style={{ fontSize: 12, color: "#5FD08A" }}>Saved ✓</p>}
            {nameSaveState === "error" && <p style={{ fontSize: 12, color: "#F2635C" }}>Couldn't save — try again.</p>}

            <div style={{ marginTop: 16, display: "flex", gap: 32, flexWrap: "wrap" }}>
              <div>
                <div style={fieldLabelStyle}>Signed in with</div>
                <div style={fieldValueStyle}>{email || "—"}</div>
              </div>
              <div>
                <div style={fieldLabelStyle}>Country</div>
                <div style={fieldValueStyle}>{country ?? "—"}</div>
                <div style={{ fontSize: 10.5, color: "var(--tv-text-faint)", marginTop: 2 }}>Based on your browser locale</div>
              </div>
            </div>
          </Panel>

          <Divider />

          {/* EMAIL */}
          <Panel id="email" title="Email">
            <div style={{ marginBottom: 18 }}>
              <Label>Login email</Label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={fieldValueStyle}>{email || "—"}</span>
                {isVerified && (
                  <span style={{
                    fontFamily: "monospace", fontSize: 9.5, fontWeight: 700,
                    letterSpacing: ".08em", textTransform: "uppercase",
                    color: "#5FD08A", background: "rgba(95,208,138,.14)",
                    padding: "2px 8px", borderRadius: 20,
                  }}>
                    Verified
                  </span>
                )}
              </div>
            </div>
            <div>
              <Label>Proposal reply-to</Label>
              <p style={{ fontSize: 12, color: "var(--tv-text-faint)", marginBottom: 8 }}>
                Client replies to shared proposals land here instead of your login email.
              </p>
              <div style={{ display: "flex", gap: 10, maxWidth: 420 }}>
                <input type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)}
                  placeholder={email || "you@yourstudio.com"} style={inputStyle} />
                <button type="button" onClick={handleSaveReplyTo} disabled={replyToSaveState === "saving"}
                  style={primaryButtonStyle}>
                  {replyToSaveState === "saving" ? "Saving…" : replyToSaveState === "saved" ? "Saved ✓" : "Save"}
                </button>
              </div>
              {replyToSaveState === "error" && <p style={{ fontSize: 12, color: "#F2635C", marginTop: 6 }}>Couldn't save — try again.</p>}
            </div>
          </Panel>

          <Divider />

          {/* PASSWORD */}
          <Panel id="password" title="Password">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div>
                <p style={{ fontSize: 13, color: "var(--tv-text)" }}>Change your password</p>
                {passwordChangedLabel && (
                  <p style={{ fontSize: 11.5, color: "var(--tv-text-faint)", marginTop: 2 }}>
                    Last changed {passwordChangedLabel}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => openUserProfile()} style={ghostButtonStyle}>
                Change password
              </button>
            </div>
          </Panel>

          <Divider />

          {/* PLAN & BILLING */}
          <Panel id="plan" title="Plan & billing">
            <div style={{
              padding: "12px 16px", borderRadius: 10, marginBottom: 18,
              background: "var(--tv-panel-accent)", border: "1px dashed var(--tv-border)",
              fontSize: 12.5, color: "var(--tv-text-faint)",
            }}>
              Plan management and billing arrive when payments launch.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, opacity: 0.55 }}>
              {PLANS.map((plan) => (
                <div key={plan.name} style={{
                  border: "1.5px solid var(--tv-border)", borderRadius: 14, padding: 18,
                  background: "var(--tv-panel-accent)",
                }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: "var(--tv-text)" }}>
                    {plan.name}
                  </div>
                  <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 3 }}>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: "var(--tv-text)" }}>
                      {plan.price}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--tv-text-faint)" }}>{plan.period}</span>
                  </div>
                  <p style={{ marginTop: 8, fontSize: 12, lineHeight: 1.5, color: "var(--tv-text-faint)" }}>{plan.desc}</p>
                  <button type="button" disabled style={{ ...primaryButtonStyle, width: "100%", marginTop: 14, cursor: "not-allowed", opacity: 0.7 }}>
                    Coming soon
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          <Divider />

          {/* YOUR DATA */}
          <Panel id="data" title="Your data">
            <p style={{ fontSize: 13, color: "var(--tv-text-faint)", marginBottom: 12, maxWidth: 480 }}>
              Download a copy of your proposals and brand settings.
            </p>
            <button type="button" onClick={handleExport} disabled={exportState === "loading"} style={ghostButtonStyle}>
              {exportState === "loading" ? "Requesting…" : "Export my data"}
            </button>
            {exportError && <p style={{ fontSize: 12, color: "#F2635C", marginTop: 8 }}>{exportError}</p>}
          </Panel>

          <Divider />

          {/* ACCOUNT ACCESS */}
          <Panel id="access" title="Account access">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button type="button" onClick={handleLogout} style={ghostButtonStyle}>
                Log out
              </button>
              <button type="button" onClick={() => setDeleteOpen(true)}
                style={{ ...ghostButtonStyle, borderColor: "#F2635C", color: "#F2635C" }}>
                Delete account
              </button>
            </div>
          </Panel>
        </div>

        {/* ── ON THIS PAGE ── */}
        <nav style={{ position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--tv-text-faint)", marginBottom: 8 }}>
            On this page
          </div>
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}
              style={{ fontSize: 12.5, color: "var(--tv-text-faint)", textDecoration: "none", padding: "4px 0" }}>
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Delete-account confirm modal */}
      {deleteOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 60,
          background: "rgba(10,19,34,.6)",
          display: "grid", placeItems: "center", padding: 20,
        }}>
          <div style={{
            width: "100%", maxWidth: 420, borderRadius: 16,
            background: "var(--tv-bg-topbar)", border: "1px solid var(--tv-border)",
            boxShadow: "var(--tv-shadow)", padding: 24,
          }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 17, color: "var(--tv-text)", marginBottom: 8 }}>
              Delete your account?
            </h2>
            <p style={{ fontSize: 13, color: "var(--tv-text-faint)", lineHeight: 1.5, marginBottom: 16 }}>
              This permanently deletes your account, workspace, and all proposals. This cannot be undone.
              Type <strong style={{ color: "var(--tv-text)" }}>DELETE</strong> to confirm.
            </p>
            <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE" style={{ ...inputStyle, marginBottom: 14 }} />
            {deleteError && <p style={{ fontSize: 12, color: "#F2635C", marginBottom: 10 }}>{deleteError}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={() => { setDeleteOpen(false); setDeleteConfirmText(""); setDeleteError(null); }}
                style={ghostButtonStyle}>
                Cancel
              </button>
              <button type="button" onClick={handleDelete}
                disabled={deleteConfirmText !== "DELETE" || deleteState === "loading"}
                style={{
                  ...primaryButtonStyle, background: "#F2635C", color: "#fff",
                  opacity: deleteConfirmText !== "DELETE" ? 0.5 : 1,
                  cursor: deleteConfirmText !== "DELETE" ? "not-allowed" : "pointer",
                }}>
                {deleteState === "loading" ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

function Panel({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ scrollMarginTop: 80, marginBottom: 8 }}>
      <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15.5, letterSpacing: "-.01em", color: "var(--tv-text)", marginBottom: 16 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--tv-border-soft)", margin: "28px 0" }} />;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 7, color: "var(--tv-text-dim)" }}>{children}</label>;
}

function formatMonthsAgo(date: Date): string {
  const months = Math.max(0, Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  if (months === 0) return "this month";
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

const inputStyle = {
  width: "100%", padding: "10px 13px",
  fontFamily: "Inter, sans-serif", fontSize: 13.5,
  borderRadius: 9, border: "1.5px solid var(--tv-border)",
  background: "var(--tv-panel-accent)", color: "var(--tv-text)",
  outline: "none",
} as const;

const fieldLabelStyle = {
  fontFamily: "monospace", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase",
  color: "var(--tv-text-faint)", marginBottom: 4,
} as const;

const fieldValueStyle = {
  fontSize: 13.5, color: "var(--tv-text)",
} as const;

const ghostButtonStyle = {
  padding: "8px 16px", borderRadius: 9,
  border: "1.5px solid var(--tv-border)", background: "transparent",
  color: "var(--tv-text)", fontFamily: "'Space Grotesk',sans-serif",
  fontWeight: 600, fontSize: 12.5, cursor: "pointer",
} as const;

const primaryButtonStyle = {
  padding: "8px 16px", borderRadius: 9, border: "none",
  background: "linear-gradient(135deg,#F2C84E,#DCAA33)", color: "#0A1322",
  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12.5, cursor: "pointer",
} as const;
