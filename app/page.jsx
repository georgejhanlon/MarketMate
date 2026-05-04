"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

const ROLES = [
  "Plumbers", "Electricians", "Builders", "Decorators", "Landscapers",
  "Roofers", "Cleaners", "Personal trainers", "Yoga instructors",
  "Hairdressers", "Barbers", "Nail technicians", "Photographers",
  "Videographers", "Florists", "Bakers", "Caterers", "Dog walkers",
  "Designers", "Copywriters", "Freelancers", "Coaches", "Consultants",
  "Therapists", "Accountants", "Estate agents", "Mechanics",
  "Driving instructors", "Restaurants", "Cafes",
];

const ITEM_H = 130;
const SPIN_DURATION = 5000;
const buildReel = () => [...ROLES, ...ROLES, ...ROLES, "__everybody__"];

export default function MarketMatePage() {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState("idle");

  const [formState, setFormState] = useState({ email: "", name: "", company: "" });
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const reelRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const heroRef = useRef(null);
  const REEL = useRef(buildReel());

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.45], [0, -50]);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
  }, []);

  const spin = useCallback(() => {
    if (!reelRef.current) return;
    setPhase("spinning");

    const reel = REEL.current;
    const totalPx = (reel.length - 1) * ITEM_H;

    reelRef.current.style.transition = "none";
    reelRef.current.style.transform = `translateY(0px)`;
    reelRef.current.style.filter = "none";
    void reelRef.current.offsetHeight;

    startTimeRef.current = performance.now();

    const frame = (now) => {
      if (!reelRef.current) return;
      const elapsed = now - startTimeRef.current;
      const t = Math.min(elapsed / SPIN_DURATION, 1);

      let progress;
      if (t < 0.20) {
        const p = t / 0.20;
        progress = p * p * 0.18;
      } else if (t < 0.65) {
        const p = (t - 0.20) / 0.45;
        progress = 0.18 + p * 0.58;
      } else {
        const p = (t - 0.65) / 0.35;
        const inv = 1 - p;
        progress = 0.76 + (1 - inv * inv * inv * inv * inv) * 0.24;
      }

      let blur = 0;
      if (t > 0.20 && t < 0.65) {
        const mid = 1 - Math.abs((t - 0.425) / 0.225);
        blur = mid * 4;
      }

      const yPx = progress * totalPx;
      reelRef.current.style.transform = `translateY(-${yPx}px)`;
      reelRef.current.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : "none";

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        reelRef.current.style.transform = `translateY(-${totalPx}px)`;
        reelRef.current.style.filter = "none";
        setPhase("done");
      }
    };

    rafRef.current = requestAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(spin, 600);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(rafRef.current);
    };
  }, [mounted, spin]);

  const handleRespin = useCallback(() => {
    if (phase === "spinning") return;
    cancelAnimationFrame(rafRef.current);
    spin();
  }, [phase, spin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.email || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("https://api.sheetmonkey.io/form/pRn9noNkhc2zJJxGzQ6CZZ", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          Email: formState.email,
          Name: formState.name || "",
          Company: formState.company || "",
          Date: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("submit failed");
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
        @font-face {
          font-family: 'Aileron';
          font-weight: 700;
          font-display: swap;
          src: url('https://cdn.jsdelivr.net/gh/suitcase/Aileron@master/Aileron-Bold.otf') format('opentype');
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
        html { scroll-behavior: smooth; }
        body {
          background: var(--bg);
          color: var(--d);
          font-family: var(--fb);
          -webkit-font-smoothing: antialiased;
        }
        .fh { font-family: var(--fh); }
        .fb { font-family: var(--fb); }
        input, textarea { outline: none; font-family: var(--fb); }

        ::selection { background: var(--o); color: white; }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 160px;
        }

        .eyebrow {
          font-size: 14px;
          font-weight: 600;
          color: var(--o);
          font-style: italic;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .eyebrow::before {
          content: '';
          width: 22px;
          height: 2px;
          background: var(--o);
          border-radius: 2px;
        }

        .squiggle {
          position: relative;
          white-space: nowrap;
        }
        .squiggle::after {
          content: '';
          position: absolute;
          left: -2%;
          right: -2%;
          bottom: -4px;
          height: 8px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M2 4 Q 25 1, 50 4 T 100 4 T 150 4 T 198 4' stroke='%23ff6b35' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-size: 100% 100%;
          background-repeat: no-repeat;
          opacity: 0.85;
        }

        .reel-window {
          height: ${ITEM_H}px;
          overflow: hidden;
          position: relative;
          width: 100%;
        }
        .reel-window::before, .reel-window::after {
          content: '';
          position: absolute; left: 0; right: 0; height: 44px; z-index: 3; pointer-events: none;
        }
        .reel-window::before { top: 0;    background: linear-gradient(to bottom, var(--bg) 0%, transparent 100%); }
        .reel-window::after  { bottom: 0; background: linear-gradient(to top,    var(--bg) 0%, transparent 100%); }

        .reel-track { will-change: transform; }
        .reel-item {
          height: ${ITEM_H}px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--fh);
          font-weight: 900;
          font-size: clamp(42px, 9vw, 100px);
          letter-spacing: -0.06em;
          line-height: 1;
          white-space: nowrap;
          text-transform: uppercase;
        }
        .reel-item.role { color: var(--d); }
        .reel-item.everybody { color: var(--o); font-size: clamp(44px, 9.5vw, 104px); letter-spacing: -0.06em; }

        .spin-btn {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 10px 20px 10px 16px;
          border-radius: 100px;
          border: 1.5px solid var(--line);
          background: white;
          color: var(--d-soft);
          font-family: var(--fb);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }
        .spin-btn:hover { border-color: var(--o); color: var(--o); background: var(--cream); }
        .spin-btn:active { transform: scale(0.97); }
        .spin-btn.spinning { opacity: 0.4; cursor: default; pointer-events: none; }

        @keyframes spin-icon { to { transform: rotate(360deg); } }
        .spin-icon { display: inline-block; font-size: 14px; line-height: 1; }
        .spin-icon.go { animation: spin-icon 0.6s linear infinite; }

        .tile {
          position: relative;
          background: white;
          border-radius: 22px;
          border: 1px solid var(--line);
          padding: 28px 28px 26px;
          transition: transform 0.32s cubic-bezier(0.22,1,0.36,1), box-shadow 0.32s, border-color 0.32s;
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        .tile:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 40px -16px rgba(42,39,37,0.14);
        }
        .tile.featured {
          background: var(--cream);
          border-color: rgba(255,107,53,0.25);
        }
        .tile.featured:hover {
          box-shadow: 0 22px 50px -18px rgba(255,107,53,0.22);
          border-color: rgba(255,107,53,0.4);
        }

        .tile-meta {
          font-size: 13px;
          font-weight: 600;
          color: var(--d-soft);
          opacity: 0.6;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tile-meta .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--d-soft);
          opacity: 0.5;
        }
        .tile.featured .tile-meta {
          color: var(--o);
          opacity: 1;
        }
        .tile.featured .tile-meta .dot { background: var(--o); opacity: 1; }

        .tile h3 {
          font-family: var(--fh);
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 10px;
          color: var(--d);
        }

        .tile-tagline {
          font-size: 15px;
          line-height: 1.55;
          color: var(--d-soft);
        }

        .tile-list {
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px dashed var(--line);
          list-style: none;
        }
        .tile.featured .tile-list { border-top-color: rgba(255,107,53,0.18); }

        .tile-list li {
          font-size: 14px;
          line-height: 1.55;
          padding: 5px 0;
          color: var(--d-soft);
          display: flex;
          gap: 10px;
        }
        .tile-list li::before {
          content: '✓';
          color: var(--o);
          font-size: 12px;
          flex-shrink: 0;
          margin-top: 4px;
          font-weight: 700;
        }

        .cycle-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          width: 100%;
          margin-top: 20px;
        }
        @media (max-width: 760px) {
          .cycle-grid { grid-template-columns: 1fr; }
        }

        .field {
          width: 100%;
          padding: 16px 20px;
          border-radius: 14px;
          border: 1.5px solid var(--line);
          background: white;
          font-size: 15px;
          color: var(--d);
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .field:focus { border-color: var(--o); box-shadow: 0 0 0 4px rgba(255,107,53,0.12); }
        .field::placeholder { color: rgba(42,39,37,0.4); }

        .divider {
          display: flex; align-items: center; gap: 18px;
          font-size: 13px; color: var(--d-soft); opacity: 0.7;
          font-style: italic;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px;
          background: var(--line);
        }

        .benefits-grid {
          margin-top: 72px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        @media (max-width: 760px) {
          .benefits-grid { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>

      <div className="grain" />

      <div style={{
        position: "fixed", top: -300, right: -200,
        width: 800, height: 800, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 62%)",
        pointerEvents: "none", zIndex: 0, filter: "blur(10px)",
      }} />

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 40px",
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          background: "rgba(250,246,239,0.78)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <span className="fh" style={{
          fontSize: 18, fontWeight: 900, letterSpacing: "-0.07em",
          color: "var(--o)", textTransform: "uppercase",
          lineHeight: 0.88, display: "inline-block",
        }}>
          MARK<span style={{ letterSpacing: "-0.16em" }}>E</span>T<br />MA<span style={{ letterSpacing: "-0.16em" }}>T</span>E
        </span>
        <motion.a href="#waitlist"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          style={{
            background: "var(--o)", color: "#fff", padding: "10px 22px",
            borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: "none",
            fontFamily: "var(--fb)", letterSpacing: "0.02em",
            boxShadow: "0 2px 14px rgba(255,107,53,0.28)",
          }}
        >Join the waitlist</motion.a>
      </motion.nav>

      {/* Hero */}
      <motion.section
        ref={heroRef}
        style={{
          minHeight: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          position: "relative", zIndex: 1,
          opacity: heroOpacity, y: heroY,
          padding: "0 24px", textAlign: "center",
        }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="fh"
          style={{
            fontSize: "clamp(36px, 7vw, 90px)",
            fontWeight: 900, letterSpacing: "-0.06em",
            color: "var(--o)", lineHeight: 0.95, marginBottom: 20,
            textTransform: "uppercase",
          }}
        >
          MARKETMA<span style={{ letterSpacing: "-0.16em" }}>T</span>E<br />IS FOR…
        </motion.h1>

        <div style={{ width: "100%", maxWidth: 960, marginBottom: 32 }}>
          <div className="reel-window">
            <div ref={reelRef} className="reel-track">
              {REEL.current.map((role, i) => (
                <div key={i} className={`reel-item ${role === "__everybody__" ? "everybody" : "role"}`}>
                  {role === "__everybody__" ? "Everybody." : role}
                </div>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <button
                className={`spin-btn${phase === "spinning" ? " spinning" : ""}`}
                onClick={handleRespin}
              >
                <span className={`spin-icon${phase === "spinning" ? " go" : ""}`}>↺</span>
                Spin again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Value prop */}
      <section id="value" style={{
        position: "relative", zIndex: 1,
        padding: "100px 40px 60px",
        maxWidth: 1200, margin: "0 auto",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)",
            gap: "clamp(40px, 8vw, 120px)",
            alignItems: "start",
          }}
        >
          <div>
            <span className="eyebrow">first, the pitch</span>
          </div>

          <div>
            <h2 className="fh" style={{
              fontSize: "clamp(28px, 4.4vw, 52px)",
              fontWeight: 900, letterSpacing: "-0.04em",
              color: "var(--d)", lineHeight: 1.08,
              marginTop: -2,
            }}>
              Marketing for businesses<br />
              that don't have time for it.
            </h2>
            <p className="fb" style={{
              marginTop: 24,
              fontSize: "clamp(15px, 1.6vw, 18px)",
              color: "var(--d-soft)",
              maxWidth: 540, lineHeight: 1.65,
            }}>
              You started your business to do the work — not to be a content strategist, copywriter, and SEO expert on the side. <em>Mate</em> handles all of that, in a way that actually sounds like you.
            </p>
          </div>
        </motion.div>

        {/* Three benefits */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="benefits-grid"
        >
          {[
            {
              h: "Made for you,",
              s: "not a template.",
              p: "Every plan is shaped around your business, your voice, your customers — never copy-paste."
            },
            {
              h: "On in minutes,",
              s: "not weeks.",
              p: "A short chat to get going. No briefs, no agency onboarding, no homework."
            },
            {
              h: "You stay",
              s: "in charge.",
              p: <><em>Mate</em> drafts, suggests, and nudges. You approve. Nothing goes out without you.</>
            },
          ].map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.08, duration: 0.6 }}
              style={{
                paddingTop: 24,
                borderTop: "1.5px solid var(--line)",
              }}
            >
              <h3 className="fh" style={{
                fontSize: "clamp(20px, 2.4vw, 26px)",
                fontWeight: 900, letterSpacing: "-0.03em",
                color: "var(--d)", lineHeight: 1.1,
                marginBottom: 12,
              }}>
                {b.h}<br />
                <span style={{ color: "var(--o)" }}>{b.s}</span>
              </h3>
              <p className="fb" style={{
                fontSize: 14, color: "var(--d-soft)",
                lineHeight: 1.6,
              }}>
                {b.p}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section style={{
        position: "relative", zIndex: 1,
        padding: "60px 40px 120px",
        maxWidth: 1200, margin: "0 auto",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)",
            gap: "clamp(40px, 8vw, 120px)",
            alignItems: "start",
            marginBottom: 56,
          }}
        >
          <div>
            <span className="eyebrow">how it works</span>
          </div>

          <div>
            <h2 className="fh" style={{
              fontSize: "clamp(28px, 4.4vw, 52px)",
              fontWeight: 900, letterSpacing: "-0.04em",
              color: "var(--d)", lineHeight: 1.08,
              marginTop: -2,
            }}>
              Set it up <span className="squiggle">once</span>.<br />
              Then let it run.
            </h2>
            <p className="fb" style={{
              marginTop: 22,
              fontSize: "clamp(14px, 1.5vw, 17px)",
              color: "var(--d-soft)",
              maxWidth: 480, lineHeight: 1.65,
            }}>
              The hard part is the start: telling <em>Mate</em> who you are. After that, it's a gentle monthly rhythm.
            </p>
          </div>
        </motion.div>

        {/* Onboard — featured */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7 }}
          className="tile featured"
          style={{ marginBottom: 28 }}
        >
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)",
            gap: 40,
            alignItems: "start",
          }}>
            <div>
              <div className="tile-meta">
                <span className="dot" />
                <span>The setup — just once</span>
              </div>
              <h3 style={{ fontSize: "clamp(28px, 3.4vw, 42px)", color: "var(--o)" }}>Onboard.</h3>
              <p className="tile-tagline" style={{ fontSize: 16, marginTop: 12 }}>
                A short conversation — not a form. <em>Mate</em> gets to know your business in roughly five minutes.
              </p>
            </div>

            <ul className="tile-list" style={{ borderTop: "none", marginTop: 0, paddingTop: 0 }}>
              <li>What you do, who buys from you, what makes you different</li>
              <li>Tone of voice, brand quirks, the things you'd never say</li>
              <li>Existing channels, current efforts, what's worked before</li>
              <li>Each onboarding shapes a unique strategy — no templates</li>
            </ul>
          </div>
        </motion.div>

        <div className="divider" style={{ marginBottom: 6 }}>
          <span>then, the monthly rhythm</span>
        </div>

        <div className="cycle-grid">
          {[
            {
              title: "Strategise",
              tag: <><em>Mate</em> drafts the plan. You shape it.</>,
              items: [
                "Recommended channels, ranked by impact",
                "90-day content calendar",
                "Competitor pulse",
                "Quick wins to start",
              ],
            },
            {
              title: "Execute",
              tag: <><em>Mate</em> does the heavy lifting.</>,
              items: [
                "Weekly task lists",
                "Ready-made content drafts",
                "Reminders, nudges, trend alerts",
                "Approve, tweak, or rewrite",
              ],
            },
            {
              title: "Learn",
              tag: <>Each cycle, sharper than the last.</>,
              items: [
                "Tracks what worked, what didn't",
                "Refines next month automatically",
                "Compounds over time",
              ],
            },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.08 * i, duration: 0.55 }}
              className="tile"
            >
              <div className="tile-meta">
                <span className="dot" />
                <span>Every month</span>
              </div>
              <h3>{step.title}</h3>
              <p className="tile-tagline">{step.tag}</p>
              <ul className="tile-list">
                {step.items.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" style={{
        position: "relative", zIndex: 1,
        padding: "100px 40px 140px",
        maxWidth: 1200, margin: "0 auto",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8 }}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.3fr)",
            gap: "clamp(40px, 8vw, 120px)",
            alignItems: "start",
          }}
        >
          <div>
            <span className="eyebrow">come along</span>
          </div>

          <div style={{ width: "100%", maxWidth: 480 }}>
            <h2 className="fh" style={{
              fontSize: "clamp(28px, 4.4vw, 52px)",
              fontWeight: 900, letterSpacing: "-0.04em",
              color: "var(--d)", lineHeight: 1.08,
              marginTop: -2,
              marginBottom: 16,
            }}>Be first in.</h2>
            <p className="fb" style={{
              fontSize: "clamp(14px, 1.5vw, 17px)",
              color: "var(--d-soft)",
              lineHeight: 1.65,
              marginBottom: 36,
            }}>
              Join the waitlist for early access and updates as we launch. We're keeping the first cohort small — and we'd love to have you in it.
            </p>

            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form key="form"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {[
                    { key: "email",   placeholder: "Email address",                 type: "email", required: true  },
                    { key: "name",    placeholder: "Your name (optional)",          type: "text",  required: false },
                    { key: "company", placeholder: "Business or trade (optional)",  type: "text",  required: false },
                  ].map(({ key, placeholder, type, required }) => (
                    <input key={key} type={type} placeholder={placeholder} required={required}
                      className="field"
                      value={formState[key]}
                      onFocus={() => setFocused(key)} onBlur={() => setFocused(null)}
                      onChange={e => setFormState(s => ({ ...s, [key]: e.target.value }))}
                    />
                  ))}
                  <motion.button type="submit"
                    disabled={submitting}
                    whileHover={!submitting ? { scale: 1.01 } : {}}
                    whileTap={!submitting ? { scale: 0.99 } : {}}
                    style={{
                      marginTop: 6, padding: "16px 24px", borderRadius: 14, border: "none",
                      background: "var(--o)", color: "#fff", fontSize: 15, fontWeight: 700,
                      fontFamily: "var(--fb)", letterSpacing: "0.01em",
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting ? 0.7 : 1,
                      transition: "background 0.18s, opacity 0.18s",
                      display: "inline-flex", alignItems: "center", justifyContent: "space-between",
                      boxShadow: "0 4px 18px rgba(255,107,53,0.28)",
                    }}
                  >
                    <span>{submitting ? "Joining…" : "Join the waitlist"}</span>
                    <span style={{ opacity: 0.85 }}>→</span>
                  </motion.button>
                  {error && (
                    <p className="fb" style={{ fontSize: 13, color: "#c0392b", marginTop: 4, fontWeight: 500 }}>
                      {error}
                    </p>
                  )}
                  <p className="fb" style={{
                    fontSize: 12, color: "var(--d-soft)",
                    opacity: 0.7, marginTop: 6, fontStyle: "italic",
                  }}>
                    No spam, ever. Unsubscribe anytime.
                  </p>
                </motion.form>
              ) : (
                <motion.div key="success"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    padding: "32px 32px 28px",
                    background: "var(--cream)",
                    borderRadius: 18,
                    border: "1.5px solid rgba(255,107,53,0.25)",
                  }}
                >
                  <div className="fb" style={{
                    fontSize: 14, color: "var(--o)", marginBottom: 12,
                    fontStyle: "italic", fontWeight: 600,
                  }}>You're on the list</div>
                  <h3 className="fh" style={{ fontSize: 26, fontWeight: 900, color: "var(--d)", letterSpacing: "-0.03em", marginBottom: 10 }}>
                    Thanks — talk soon.
                  </h3>
                  <p className="fb" style={{ fontSize: 15, color: "var(--d-soft)", lineHeight: 1.6 }}>
                    Watch your inbox. We'll be in touch with early access as we launch.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      <footer style={{
        position: "relative", zIndex: 1,
        padding: "32px 40px",
        borderTop: "1px solid var(--line)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12,
      }}>
        <span className="fh" style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.04em", color: "var(--d)" }}>
          MarketMate
        </span>
        <span className="fb" style={{ fontSize: 13, color: "var(--d-soft)", opacity: 0.7, fontStyle: "italic" }}>
          made with care, in the UK · © {new Date().getFullYear()}
        </span>
      </footer>
    </>
  );
}
