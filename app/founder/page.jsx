"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PUBLIC = true; // Flip to false to "close the door" — page returns 404-style screen

export default function FounderPage() {
  const [form, setForm] = useState({
    name: "",
    business: "",
    email: "",
    phone: "",
    description: "",
  });
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const requiredFilled = form.name && form.business && form.email && form.phone && form.description;
  const canSubmit = requiredFilled && agree && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("https://api.sheetmonkey.io/form/pRn9noNkhc2zJJxGzQ6CZZ", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          Type: "Founder Member",
          Name: form.name,
          Business: form.business,
          Email: form.email,
          Phone: form.phone,
          Description: form.description,
          AgreedAt: new Date().toISOString(),
          PricingTerms: "£29 today, June 2026 free, then £29/month in perpetuity",
        }),
      });
      if (!res.ok) throw new Error("submit failed");
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Try again, or email george@getmarketmate.co.uk.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!PUBLIC) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#faf6ef", fontFamily: "Raleway, sans-serif", color: "#2a2725",
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, fontStyle: "italic", color: "#6b6560", opacity: 0.6 }}>
            Nothing here, sorry.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700;800&display=swap');

        @font-face {
          font-family: 'Aileron';
          font-weight: 900;
          font-display: swap;
          src: url('https://cdn.jsdelivr.net/gh/suitcase/Aileron@master/Aileron-Black.otf') format('opentype');
        }

        :root {
          --o:  #ff6b35;
          --o-soft: #ffe9dd;
          --d:  #2a2725;
          --d-soft: #6b6560;
          --bg: #faf6ef;
          --bg-warm: #f4ede1;
          --cream: #fff8ee;
          --line: rgba(42,39,37,0.08);
          --fh: 'Aileron', 'Helvetica Neue', Arial, sans-serif;
          --fb: 'Raleway', sans-serif;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--d); font-family: var(--fb); -webkit-font-smoothing: antialiased; }
        ::selection { background: var(--o); color: white; }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 160px;
        }

        .field {
          width: 100%;
          padding: 14px 18px;
          border-radius: 12px;
          border: 1.5px solid var(--line);
          background: white;
          font-size: 15px;
          font-family: var(--fb);
          color: var(--d);
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .field:focus { border-color: var(--o); box-shadow: 0 0 0 4px rgba(255,107,53,0.12); }
        .field::placeholder { color: rgba(42,39,37,0.4); }
        textarea.field { resize: vertical; min-height: 100px; line-height: 1.5; }

        .label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--d);
          margin-bottom: 8px;
        }
        .label .req { color: var(--o); margin-left: 3px; }

        .eyebrow {
          font-size: 14px;
          font-weight: 600;
          color: var(--o);
          font-style: italic;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }
        .eyebrow::before {
          content: '';
          width: 22px;
          height: 2px;
          background: var(--o);
          border-radius: 2px;
        }

        .pricing-row {
          display: grid;
          grid-template-columns: 78px 1fr auto;
          gap: 16px;
          align-items: baseline;
          padding: 16px 0;
          border-bottom: 1px dashed var(--line);
        }
        .pricing-row:last-child { border-bottom: none; }
        .pricing-row .when {
          font-size: 12px;
          font-weight: 700;
          color: var(--o);
          text-transform: lowercase;
          font-style: italic;
        }
        .pricing-row .what {
          font-size: 15px;
          color: var(--d);
          font-weight: 600;
          line-height: 1.4;
        }
        .pricing-row .what em {
          font-style: normal;
          color: var(--d-soft);
          font-size: 13px;
          font-weight: 400;
          display: block;
          margin-top: 3px;
        }
        .pricing-row .amount {
          font-family: var(--fh);
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: var(--d);
        }
        .pricing-row .amount.free { color: var(--o); }
        .pricing-row .amount .per {
          font-size: 12px;
          font-weight: 400;
          color: var(--d-soft);
          letter-spacing: 0;
          font-family: var(--fb);
          font-style: italic;
        }

        @media (max-width: 720px) {
          .layout-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="grain" />

      <div style={{
        position: "fixed", top: -300, right: -200,
        width: 800, height: 800, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 62%)",
        pointerEvents: "none", zIndex: 0, filter: "blur(10px)",
      }} />

      <main style={{
        position: "relative", zIndex: 1,
        minHeight: "100vh",
        padding: "60px 40px 100px",
        maxWidth: 1100,
        margin: "0 auto",
      }}>
        {/* Top header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingBottom: 24, marginBottom: 60,
          borderBottom: "1px solid var(--line)",
        }}>
          <a href="/" className="fh" style={{
            fontSize: 16, fontWeight: 900, letterSpacing: "-0.07em",
            color: "var(--o)", textTransform: "uppercase",
            lineHeight: 0.88, textDecoration: "none",
          }}>
            MARK<span style={{ letterSpacing: "-0.16em" }}>E</span>T<br/>MA<span style={{ letterSpacing: "-0.16em" }}>T</span>E
          </a>
          <span className="fb" style={{
            fontSize: 13, color: "var(--d-soft)",
            fontStyle: "italic",
          }}>
            for our founders ✿
          </span>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="layout-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1.15fr)",
                gap: "clamp(40px, 7vw, 96px)",
                alignItems: "start",
              }}
            >
              {/* Left — pitch + pricing */}
              <div>
                <span className="eyebrow">a private invite</span>

                <h1 className="fh" style={{
                  fontSize: "clamp(34px, 5.5vw, 60px)",
                  fontWeight: 900, letterSpacing: "-0.045em",
                  color: "var(--d)", lineHeight: 1.02,
                  marginBottom: 22,
                }}>
                  You're<br />
                  one of <span style={{ color: "var(--o)" }}>twenty</span>.
                </h1>

                <p className="fb" style={{
                  fontSize: 16, color: "var(--d-soft)",
                  lineHeight: 1.65, marginBottom: 32,
                  maxWidth: 440,
                }}>
                  This page is for the first twenty businesses we're building MarketMate around. You'll get founder pricing locked in for life, a direct line to us, and the chance to shape what we build next.
                </p>

                {/* Pricing card */}
                <div style={{
                  background: "white",
                  border: "1.5px solid var(--line)",
                  borderRadius: 20,
                  padding: "28px 28px 24px",
                  position: "relative",
                  boxShadow: "0 8px 30px -16px rgba(42,39,37,0.1)",
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "baseline", marginBottom: 10,
                  }}>
                    <span className="fh" style={{
                      fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em",
                      color: "var(--d)",
                    }}>
                      Your founder pricing
                    </span>
                    <span className="fb" style={{
                      fontSize: 12, color: "var(--o)",
                      fontStyle: "italic", fontWeight: 600,
                    }}>
                      locked for life
                    </span>
                  </div>
                  <p className="fb" style={{
                    fontSize: 13, color: "var(--d-soft)",
                    marginBottom: 8, fontStyle: "italic",
                  }}>
                    Here's exactly how it works — no surprises, ever.
                  </p>

                  <div className="pricing-row">
                    <span className="when">today</span>
                    <span className="what">
                      Founder fee
                      <em>Charged on signup</em>
                    </span>
                    <span className="amount">£29</span>
                  </div>

                  <div className="pricing-row">
                    <span className="when">June '26</span>
                    <span className="what">
                      First month — on us
                      <em>A thank you for backing us early</em>
                    </span>
                    <span className="amount free">Free</span>
                  </div>

                  <div className="pricing-row">
                    <span className="when">July '26+</span>
                    <span className="what">
                      Every month after
                      <em>Founder rate, never goes up</em>
                    </span>
                    <span className="amount">£29 <span className="per">/mo</span></span>
                  </div>

                  <div style={{
                    marginTop: 18, paddingTop: 16,
                    borderTop: "1px solid var(--line)",
                    display: "flex", justifyContent: "space-between",
                    alignItems: "baseline",
                    fontSize: 13, color: "var(--d-soft)",
                    fontStyle: "italic",
                  }}>
                    <span>Cancel anytime</span>
                    <span>No contract</span>
                  </div>
                </div>

                <p className="fb" style={{
                  marginTop: 18, fontSize: 13,
                  color: "var(--d-soft)", lineHeight: 1.6,
                  fontStyle: "italic",
                }}>
                  Public price will be £49/mo. Founder rate is yours as long as your subscription stays active.
                </p>
              </div>

              {/* Right — form */}
              <form onSubmit={handleSubmit} style={{
                background: "white",
                border: "1.5px solid var(--line)",
                borderRadius: 22,
                padding: "32px",
                display: "flex", flexDirection: "column", gap: 18,
                boxShadow: "0 8px 30px -16px rgba(42,39,37,0.1)",
              }}>
                <div style={{ marginBottom: 4 }}>
                  <h2 className="fh" style={{
                    fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em",
                    color: "var(--d)", marginBottom: 8,
                  }}>
                    Claim your spot
                  </h2>
                  <p className="fb" style={{ fontSize: 14, color: "var(--d-soft)", lineHeight: 1.5 }}>
                    Five quick fields. We'll be in touch within 24 hours.
                  </p>
                </div>

                <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label className="label">Your name <span className="req">*</span></label>
                    <input
                      className="field"
                      type="text"
                      required
                      value={form.name}
                      placeholder="Jane Smith"
                      onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Business name <span className="req">*</span></label>
                    <input
                      className="field"
                      type="text"
                      required
                      value={form.business}
                      placeholder="Smith & Co."
                      onChange={e => setForm(s => ({ ...s, business: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Email <span className="req">*</span></label>
                  <input
                    className="field"
                    type="email"
                    required
                    value={form.email}
                    placeholder="jane@smithco.uk"
                    onChange={e => setForm(s => ({ ...s, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="label">Phone <span className="req">*</span></label>
                  <input
                    className="field"
                    type="tel"
                    required
                    value={form.phone}
                    placeholder="07XXX XXX XXX"
                    onChange={e => setForm(s => ({ ...s, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="label">Tell us about your business <span className="req">*</span></label>
                  <textarea
                    className="field"
                    required
                    rows={4}
                    value={form.description}
                    placeholder="A couple of sentences. What you do, who you do it for, and where you're based."
                    onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
                  />
                </div>

                {/* Agreement */}
                <label style={{
                  display: "flex", gap: 12, alignItems: "flex-start",
                  padding: "16px 18px",
                  background: "var(--cream)",
                  border: "1.5px solid rgba(255,107,53,0.18)",
                  borderRadius: 14,
                  cursor: "pointer",
                  marginTop: 4,
                }}>
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={e => setAgree(e.target.checked)}
                    style={{
                      marginTop: 3,
                      width: 16, height: 16,
                      accentColor: "var(--o)",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  />
                  <span className="fb" style={{ fontSize: 13.5, color: "var(--d-soft)", lineHeight: 1.55 }}>
                    Happy with the founder terms: <strong style={{ color: "var(--d)" }}>£29 today</strong>, June 2026 free, then <strong style={{ color: "var(--d)" }}>£29/month</strong> from July 2026 onwards. Cancel anytime.
                  </span>
                </label>

                <motion.button
                  type="submit"
                  disabled={!canSubmit}
                  whileHover={canSubmit ? { scale: 1.01 } : {}}
                  whileTap={canSubmit ? { scale: 0.99 } : {}}
                  style={{
                    marginTop: 4,
                    padding: "16px 24px",
                    borderRadius: 14,
                    border: "none",
                    background: canSubmit ? "var(--o)" : "rgba(42,39,37,0.18)",
                    color: "#fff",
                    fontSize: 15, fontWeight: 700,
                    fontFamily: "var(--fb)", letterSpacing: "0.01em",
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    transition: "background 0.2s, opacity 0.2s",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    boxShadow: canSubmit ? "0 4px 18px rgba(255,107,53,0.28)" : "none",
                  }}
                >
                  <span>{submitting ? "Sending…" : "Become a founder member"}</span>
                  <span style={{ opacity: 0.85 }}>→</span>
                </motion.button>

                {error && (
                  <p className="fb" style={{ fontSize: 13, color: "#c0392b", fontWeight: 500 }}>{error}</p>
                )}

                <p className="fb" style={{
                  fontSize: 12, color: "var(--d-soft)",
                  lineHeight: 1.6, opacity: 0.8,
                  fontStyle: "italic",
                  marginTop: 4,
                }}>
                  Payment isn't taken until we've spoken. We'll confirm details and send a secure payment link.
                </p>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{
                maxWidth: 560, margin: "60px auto 0",
                textAlign: "left",
              }}
            >
              <span className="eyebrow">welcome aboard ✿</span>

              <h1 className="fh" style={{
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 900, letterSpacing: "-0.045em",
                color: "var(--d)", lineHeight: 1.02,
                marginBottom: 24,
              }}>
                Thanks, {form.name.split(" ")[0]}.
              </h1>

              <p className="fb" style={{
                fontSize: 16, color: "var(--d-soft)",
                lineHeight: 1.65, marginBottom: 28,
              }}>
                We've got your details for <strong style={{ color: "var(--d)" }}>{form.business}</strong>. Either George or Hugo will reach out within 24 hours — usually sooner — to say hello and run through the first onboarding chat.
              </p>

              <div style={{
                background: "white",
                border: "1.5px solid var(--line)",
                borderRadius: 18,
                padding: "22px 24px",
                marginBottom: 24,
                boxShadow: "0 8px 30px -16px rgba(42,39,37,0.1)",
              }}>
                <p className="fb" style={{
                  fontSize: 14, fontWeight: 700, color: "var(--d)",
                  marginBottom: 12,
                }}>What happens next</p>
                <ol style={{ paddingLeft: 18, margin: 0 }}>
                  {[
                    "We call or email to say hello",
                    "Quick onboarding chat (about 5 minutes)",
                    "Secure payment link for your first month",
                    "You're a founder member ✿",
                  ].map((step, i) => (
                    <li key={i} className="fb" style={{
                      fontSize: 14.5, color: "var(--d-soft)",
                      lineHeight: 1.7, padding: "3px 0",
                    }}>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <p className="fb" style={{
                fontSize: 14, color: "var(--d-soft)",
                lineHeight: 1.6, fontStyle: "italic",
              }}>
                Anything urgent? Drop me a line at <a href="mailto:george@getmarketmate.co.uk" style={{ color: "var(--o)", textDecoration: "none", borderBottom: "1px solid currentColor", fontStyle: "normal", fontWeight: 600 }}>george@getmarketmate.co.uk</a>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer style={{
        position: "relative", zIndex: 1,
        padding: "24px 40px",
        borderTop: "1px solid var(--line)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12,
      }}>
        <span className="fh" style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-0.04em", color: "var(--d)" }}>
          MarketMate
        </span>
        <span className="fb" style={{ fontSize: 12, color: "var(--d-soft)", opacity: 0.7, fontStyle: "italic" }}>
          a private page — please don't share
        </span>
      </footer>
    </>
  );
}
