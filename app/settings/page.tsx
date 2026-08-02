"use client";
import { useState, useCallback, useEffect } from "react";
import BlockchainCanvas from "@/components/BlockchainCanvas";

interface UserSettings {
  id: string;
  theme: string;
  preferredNetwork: string;
  aiModel: string | null;
  emailAlerts: boolean;
  highRiskAlerts: boolean;
}

interface SettingsResponse {
  settings: UserSettings;
  apiStatus: {
    openrouter: boolean;
    etherscan: boolean;
    rpc: boolean;
    database: string;
  };
  networks: Record<string, string>;
  error?: string;
}

function Skeleton({ h = "h-4", w = "w-full" }: { h?: string; w?: string }) {
  return <div className={`skeleton ${h} ${w} rounded-lg`} />;
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Partial<UserSettings>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load settings");
        setLoading(false);
        return;
      }
      setData(json);
      setForm({
        theme: json.settings.theme,
        preferredNetwork: json.settings.preferredNetwork,
        aiModel: json.settings.aiModel,
        emailAlerts: json.settings.emailAlerts,
        highRiskAlerts: json.settings.highRiskAlerts,
      });
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        const json = await res.json();
        setError(json.error || "Failed to save settings");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSaving(false);
  }, [form]);

  const applyTheme = (theme: string) => {
    setForm((f) => ({ ...f, theme }));
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("wb_theme", theme);
    } catch {}
  };

  return (
    <div className="page-in relative min-h-screen">
      <BlockchainCanvas />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--wb-color-hero-overlay)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <div className="wb-container py-[72px]">
          <div className="mb-8">
            <h1 style={{ fontFamily: "var(--wb-font-display)", fontSize: "clamp(1.8rem,3.5vw,2.5rem)", fontWeight: 400, color: "var(--wb-color-text-primary)", marginBottom: "0.5rem" }}>
              Settings
            </h1>
            <p style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.9375rem" }}>
              Customise your WaveBlock experience and check service status.
            </p>
          </div>

          {loading && (
            <div className="mx-auto max-w-2xl space-y-6 animate-pulse">
              <div className="wb-card p-6 space-y-3"><Skeleton h="h-5" w="w-40" /><Skeleton h="h-10" /><Skeleton h="h-10" /></div>
              <div className="wb-card p-6 space-y-3"><Skeleton h="h-5" w="w-40" /><Skeleton h="h-6" /><Skeleton h="h-6" /></div>
            </div>
          )}

          {error && (
            <div className="mx-auto wb-card p-4 mb-8 max-w-2xl" style={{ border: "1px solid rgba(239,68,68,0.22)", background: "rgba(239,68,68,0.07)" }}>
              <p style={{ color: "var(--wb-color-danger)", fontSize: "0.875rem", fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {data && !loading && (
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="wb-card p-6">
                <h3 style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", marginBottom: "1rem", fontSize: "1.1rem" }}>
                  Appearance
                </h3>
                <div className="flex gap-3">
                  {["light", "dark"].map((t) => (
                    <button
                      key={t}
                      onClick={() => applyTheme(t)}
                      style={{
                        flex: 1, padding: "0.75rem", borderRadius: "var(--wb-radius-md)", cursor: "pointer",
                        background: form.theme === t ? "var(--wb-color-primary-soft)" : "var(--wb-color-surface)",
                        border: form.theme === t ? "1.5px solid var(--wb-color-primary)" : "1px solid var(--wb-color-border)",
                        color: "var(--wb-color-text-primary)", fontWeight: 600, fontSize: "0.875rem",
                      }}
                    >
                      {t === "light" ? "☀️ Light" : "🌙 Dark"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wb-card p-6">
                <h3 style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", marginBottom: "1rem", fontSize: "1.1rem" }}>
                  Preferences
                </h3>
                <div className="space-y-4">
                  <div>
                    <label style={{ display: "block", color: "var(--wb-color-text-secondary)", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.375rem" }}>
                      Preferred Network
                    </label>
                    <select
                      value={form.preferredNetwork || "ethereum"}
                      onChange={(e) => setForm((f) => ({ ...f, preferredNetwork: e.target.value }))}
                      style={{
                        width: "100%", padding: "0.625rem 0.875rem", borderRadius: "var(--wb-radius-sm)",
                        border: "1.5px solid var(--wb-color-border-strong)", background: "var(--wb-color-surface)",
                        color: "var(--wb-color-text-primary)", fontSize: "0.875rem", outline: "none",
                      }}
                    >
                      {Object.entries(data.networks).map(([key, label]) => (
                        <option key={key} value={key} style={{ background: "var(--wb-color-background)", color: "var(--wb-color-text-primary)" }}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", color: "var(--wb-color-text-secondary)", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.375rem" }}>
                      AI Model (optional override)
                    </label>
                    <input
                      type="text"
                      value={form.aiModel || ""}
                      onChange={(e) => setForm((f) => ({ ...f, aiModel: e.target.value || null }))}
                      placeholder="google/gemini-2.5-flash"
                      className="wb-input w-full"
                      style={{ padding: "0.625rem 0.875rem", border: "1.5px solid var(--wb-color-border-strong)", borderRadius: "var(--wb-radius-sm)", fontSize: "0.875rem", background: "var(--wb-color-surface)", outline: "none" }}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--wb-color-surface)", border: "1px solid var(--wb-color-border)" }}>
                    <div>
                      <p style={{ color: "var(--wb-color-text-primary)", fontWeight: 600, fontSize: "0.85rem" }}>High-risk alerts</p>
                      <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.75rem" }}>Flag dangerous transactions in the Guardian</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!form.highRiskAlerts}
                      onChange={(e) => setForm((f) => ({ ...f, highRiskAlerts: e.target.checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--wb-color-surface)", border: "1px solid var(--wb-color-border)" }}>
                    <div>
                      <p style={{ color: "var(--wb-color-text-primary)", fontWeight: 600, fontSize: "0.85rem" }}>Email alerts</p>
                      <p style={{ color: "var(--wb-color-text-muted)", fontSize: "0.75rem" }}>Receive periodic security digests (coming soon)</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!form.emailAlerts}
                      onChange={(e) => setForm((f) => ({ ...f, emailAlerts: e.target.checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="wb-card p-6">
                <h3 style={{ fontFamily: "var(--wb-font-display)", fontWeight: 500, color: "var(--wb-color-text-primary)", marginBottom: "1rem", fontSize: "1.1rem" }}>
                  Service Status
                </h3>
                <div className="space-y-2.5">
                  {[
                    { label: "OpenRouter (AI)", ok: data.apiStatus.openrouter },
                    { label: "Etherscan (On-chain data)", ok: data.apiStatus.etherscan },
                    { label: "RPC Provider", ok: data.apiStatus.rpc },
                    { label: "Database", ok: true, note: data.apiStatus.database },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--wb-color-border-soft)" }}>
                      <span style={{ color: "var(--wb-color-text-secondary)", fontSize: "0.875rem" }}>{s.label}</span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: s.ok ? "rgba(24,195,126,0.10)" : "rgba(239,68,68,0.10)",
                          color: s.ok ? "var(--wb-color-success)" : "var(--wb-color-danger)",
                          border: `1px solid ${s.ok ? "rgba(24,195,126,0.22)" : "rgba(239,68,68,0.22)"}`,
                        }}
                      >
                        {s.ok ? "● Connected" : "● Not configured"}{s.note ? ` · ${s.note}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={save}
                  disabled={saving}
                  className="btn-primary"
                  style={{
                    padding: "0.75rem 2rem",
                    borderRadius: "var(--wb-radius-md)"
                  }}
                >
                  {saving ? "Saving…" : "Save Settings"}
                </button>
                {saved && <span style={{ color: "var(--wb-color-success)", fontWeight: 600, fontSize: "0.875rem" }}>✓ Saved</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
