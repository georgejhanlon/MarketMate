"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

const ROLES = [
  "Plumbers",
  "Electricians",
  "Builders",
  "Decorators",
  "Landscapers",
  "Roofers",
  "Cleaners",
  "Personal trainers",
  "Yoga instructors",
  "Hairdressers",
  "Barbers",
  "Nail technicians",
  "Photographers",
  "Videographers",
  "Florists",
  "Bakers",
  "Caterers",
  "Dog walkers",
  "Designers",
  "Copywriters",
  "Freelancers",
  "Coaches",
  "Consultants",
  "Therapists",
  "Accountants",
  "Estate agents",
  "Mechanics",
  "Driving instructors",
  "Restaurants",
  "Cafes",
];

const ITEM_H       = 130;  // px per slot
const SPIN_DURATION = 5000; // ms

// We render: [...ROLES, "Everybody"] as the final reel strip.
// The reel travels from index 0 to the last item ("Everybody").
// We triple the ROLES portion so there's plenty of scroll room,
// then append a single "Everybody" at the very end.
const buildReel = () => [...ROLES, ...ROLES, ...ROLES, "__everybody__"];

export default function MarketMatePage() {
  const [mounted, setMounted] = useState(false);
  // phase: idle | spinning | done
  const [phase, setPhase]     = useState("idle");

  const [formState, setFormState] = useState({ email: "", name: "", company: "" });
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused]     = useState(null);

  const reelRef      = useRef(null);
  const rafRef       = useRef(null);
  const startTimeRef = useRef(null);
  const heroRef      = useRef(null);
  const REEL         = useRef(buildReel());

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const heroY       = useTransform(scrollYProgress, [0, 0.45], [0, -50]);

  // ── Confirm client painted ──────────────────────────────────────────────
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
  }, []);

  // ── Core spin function — callable for both auto-start and respin ─────────
  const spin = useCallback(() => {
    if (!reelRef.current) return;
    setPhase("spinning");

    const reel      = REEL.current;
    const endIndex  = reel.length - 1; // the "__everybody__" slot
    // Start from somewhere in the first ROLES copy so travel looks long
    const startIndex = 0;
    const totalItems = endIndex - startIndex; // items to travel
    const totalPx    = totalItems * ITEM_H;

    // Snap reel to start position instantly
    reelRef.current.style.transition = "none";
    reelRef.current.style.transform  = `translateY(0px)`;
    reelRef.current.style.filter     = "none";

    // Force reflow so the snap applies before RAF starts
    void reelRef.current.offsetHeight;

    startTimeRef.current = performance.now();

    const frame = (now) => {
      if (!reelRef.current) return;
      const elapsed = now - startTimeRef.current;
      const t = Math.min(elapsed / SPIN_DURATION, 1);

      // Easing:
      // 0 → 0.20  accelerate (easeInQuad)
      // 0.20 → 0.65  cruise (linear, but capped speed so words are readable)
      // 0.65 → 1.00  decelerate (easeOutQuint) — smooth landing
      let progress;
      if (t < 0.20) {
        const p = t / 0.20;
        progress = p * p * 0.18; // 0 → 0.18 of total distance
      } else if (t < 0.65) {
        const p = (t - 0.20) / 0.45;
        progress = 0.18 + p * 0.58; // 0.18 → 0.76
      } else {
        const p   = (t - 0.65) / 0.35;
        const inv = 1 - p;
        // easeOutQuint: starts exactly where cruise left off, lands at 1.0
        progress = 0.76 + (1 - inv * inv * inv * inv * inv) * 0.24;
      }

      // Mild blur only during cruise (middle 45%) — max 4px, readable
      let blur = 0;
      if (t > 0.20 && t < 0.65) {
        const mid = 1 - Math.abs((t - 0.425) / 0.225); // 0→1→0 across cruise
        blur = mid * 4;
      }

      const yPx = progress * totalPx;
      reelRef.current.style.transform = `translateY(-${yPx}px)`;
      reelRef.current.style.filter    = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : "none";

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        // Snap clean to exact end
        reelRef.current.style.transform = `translateY(-${totalPx}px)`;
        reelRef.current.style.filter    = "none";
        setPhase("done");
      }
    };

    rafRef.current = requestAnimationFrame(frame);
  }, []);

  // Auto-start spin after mount
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(spin, 600);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(rafRef.current);
    };
  }, [mounted, spin]);

  // Respin on click
  const handleRespin = useCallback(() => {
    if (phase === "spinning") return;
    cancelAnimationFrame(rafRef.current);
    spin();
  }, [phase, spin]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
          --d:  #292b2d;
          --bg: #f2f2f2;
          --fh: 'Aileron', 'Helvetica Neue', Arial, sans-serif;
          --fb: 'Raleway', sans-serif;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--d); font-family: var(--fb); -webkit-font-smoothing: antialiased; }
        .fh { font-family: var(--fh); }
        .fb { font-family: var(--fb); }
        input { outline: none; font-family: var(--fb); }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 160px;
        }

        /* ── Reel ── */
        .reel-window {
          height: ${ITEM_H}px;
          overflow: hidden;
          position: relative;
          width: 100%;
        }
        /* top + bottom fade so items appear/disappear smoothly */
        .reel-window::before,
        .reel-window::after {
          content: '';
          position: absolute; left: 0; right: 0; height: 40px; z-index: 3; pointer-events: none;
        }
        .reel-window::before { top: 0;    background: linear-gradient(to bottom, var(--bg) 0%, transparent 100%); }
        .reel-window::after  { bottom: 0; background: linear-gradient(to top,    var(--bg) 0%, transparent 100%); }

        .reel-track {
          will-change: transform;
          /* NO CSS transition — RAF drives it entirely */
        }
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
        .reel-item.role     { color: var(--d); }
        .reel-item.everybody { color: var(--o); font-size: clamp(44px, 9.5vw, 104px); letter-spacing: -0.06em; }

        /* Spin button */
        .spin-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          border-radius: 100px;
          border: 1.5px solid rgba(41,43,45,0.15);
          background: transparent;
          color: var(--d);
          font-family: var(--fb);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, opacity 0.2s;
          opacity: 1;
        }
        .spin-btn:hover  { border-color: var(--o); background: rgba(255,107,53,0.05); }
        .spin-btn:active { transform: scale(0.97); }
        .spin-btn.spinning { opacity: 0.4; cursor: default; pointer-events: none; }

        @keyframes spin-icon { to { transform: rotate(360deg); } }
        .spin-icon { display: inline-block; font-size: 16px; }
        .spin-icon.go { animation: spin-icon 0.6s linear infinite; }

        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .cur {
          display: inline-block; width: 2.5px; height: 0.8em;
          background: #fff; margin-left: 3px; vertical-align: middle;
          border-radius: 1px; animation: blink 1.1s step-end infinite;
        }
      `}</style>

      <div className="grain" />
      <div style={{
        position:"fixed", top:"-18vh", left:"50%", transform:"translateX(-50%)",
        width:"75vw", height:"75vw", maxWidth:860, maxHeight:860, borderRadius:"50%",
        background:"radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 68%)",
        pointerEvents:"none", zIndex:0,
      }} />

      {/* ── Nav ── */}
      <motion.nav
        initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.6, ease:[0.22,1,0.36,1] }}
        style={{
          position:"fixed", top:0, left:0, right:0, zIndex:100,
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"20px 40px",
          backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
          background:"rgba(242,242,242,0.84)",
        }}
      >
        <span className="fh" style={{
          fontSize:18, fontWeight:900, letterSpacing:"-0.07em",
          color:"var(--o)", textTransform:"uppercase",
          lineHeight:0.88, display:"inline-block",
        }}>
          MARK<span style={{ letterSpacing:"-0.16em" }}>E</span>T<br/>MA<span style={{ letterSpacing:"-0.16em" }}>T</span>E
        </span>
        <motion.a href="#waitlist"
          whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          style={{
            background:"var(--o)", color:"#fff", padding:"9px 22px",
            borderRadius:100, fontSize:13, fontWeight:600, textDecoration:"none",
            fontFamily:"var(--fb)", letterSpacing:"0.04em", textTransform:"uppercase",
            boxShadow:"0 2px 14px rgba(255,107,53,0.28)",
          }}
        >Join waitlist</motion.a>
      </motion.nav>

      {/* ── Hero ── */}
      <motion.section
        ref={heroRef}
        style={{
          minHeight:"100vh",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          position:"relative", zIndex:1,
          opacity:heroOpacity, y:heroY,
          padding:"0 24px", textAlign:"center",
        }}
      >
        <motion.h1
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.2, duration:0.7, ease:[0.22,1,0.36,1] }}
          className="fh"
          style={{
            fontSize:"clamp(36px,7vw,90px)",
            fontWeight:900, letterSpacing:"-0.06em",
            color:"var(--o)", lineHeight:0.95, marginBottom:20,
            textTransform:"uppercase",
          }}
        >
          MARKETMA<span style={{ letterSpacing:"-0.16em" }}>T</span>E<br/>IS FOR…
        </motion.h1>

        {/* ── Reel ── */}
        <div style={{ width:"100%", maxWidth:960, marginBottom:32 }}>
          <div className="reel-window">
            <div ref={reelRef} className="reel-track">
              {REEL.current.map((role, i) => (
                <div
                  key={i}
                  className={`reel-item ${role === "__everybody__" ? "everybody" : "role"}`}
                >
                  {role === "__everybody__" ? "Everybody." : role}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Spin button + scroll hint ── */}
        <AnimatePresence>
          {phase === "done" && (
            <motion.div
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.6 }}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}
            >
              {/* Spin again button */}
              <button
                className={`spin-btn${phase === "spinning" ? " spinning" : ""}`}
                onClick={handleRespin}
              >
                <span className={`spin-icon${phase === "spinning" ? " go" : ""}`}>↺</span>
                Spin again
              </button>

              {/* Scroll hint */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                <p className="fb" style={{
                  fontSize:10, color:"var(--d)", opacity:0.3,
                  letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:500,
                }}>
                  Scroll to continue
                </p>
                <motion.a href="#value"
                  animate={{ y:[0,6,0] }}
                  transition={{ repeat:Infinity, duration:1.8, ease:"easeInOut" }}
                  style={{ color:"var(--d)", opacity:0.2, fontSize:20, textDecoration:"none" }}
                >↓</motion.a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ── Value prop ── */}
      <section id="value" style={{
        position:"relative", zIndex:1, minHeight:"50vh",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"120px 24px", textAlign:"center",
      }}>
        <motion.div
          initial={{ scaleX:0 }} whileInView={{ scaleX:1 }}
          viewport={{ once:true, margin:"-80px" }}
          transition={{ duration:0.85, ease:[0.22,1,0.36,1] }}
          style={{ width:40, height:2, background:"var(--o)", borderRadius:2, marginBottom:44, transformOrigin:"left" }}
        />
        <motion.h2 className="fh"
          initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true, margin:"-60px" }}
          transition={{ duration:0.85, ease:[0.22,1,0.36,1] }}
          style={{ fontSize:"clamp(24px,4.5vw,52px)", fontWeight:900, letterSpacing:"-0.04em", color:"var(--d)", maxWidth:720, lineHeight:1.14 }}
        >
          MarketMate helps businesses{" "}
          <span style={{ color:"var(--o)" }}>get more customers</span>,
          without the hassle.
        </motion.h2>
        <motion.p className="fb"
          initial={{ opacity:0, y:18 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true, margin:"-60px" }}
          transition={{ delay:0.14, duration:0.8 }}
          style={{ marginTop:28, fontSize:"clamp(15px,1.8vw,19px)", color:"var(--d)", opacity:0.5, maxWidth:500, lineHeight:1.7 }}
        >
          AI-powered marketing, built around your business — so you can focus on the work you're actually good at.
        </motion.p>
      </section>

      {/* ── How it works ── */}
      <section style={{
        position:"relative", zIndex:1,
        display:"flex", flexDirection:"column", alignItems:"center",
        padding:"40px 24px 120px",
      }}>
        <style>{`
          .hiw-card {
            background: #fff;
            border-radius: 18px;
            border: 1px solid rgba(41,43,45,0.08);
            padding: 22px 24px 26px;
            cursor: pointer;
            transition: all 0.32s cubic-bezier(0.22, 1, 0.36, 1);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .hiw-card:hover {
            border-color: rgba(255,107,53,0.4);
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(255,107,53,0.1);
          }
          .hiw-card.featured { background: #ff6b35; border-color: #ff6b35; }
          .hiw-card.featured:hover { box-shadow: 0 12px 32px rgba(255,107,53,0.32); }

          .hiw-detail {
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            transition: max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease, margin 0.4s;
            margin-top: 0;
          }
          .hiw-card:hover .hiw-detail {
            max-height: 280px;
            opacity: 1;
            margin-top: 14px;
          }

          .hiw-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            width: 100%;
          }
          @media (max-width: 720px) {
            .hiw-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        <motion.div
          initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true, margin:"-60px" }}
          transition={{ duration:0.8, ease:[0.22,1,0.36,1] }}
          style={{ maxWidth:880, width:"100%", textAlign:"center" }}
        >
          <p className="fb" style={{
            fontSize:11, fontWeight:600, letterSpacing:"0.2em",
            textTransform:"uppercase", color:"var(--o)", marginBottom:14,
          }}>How it works</p>

          <h2 className="fh" style={{
            fontSize:"clamp(28px,4.5vw,48px)", fontWeight:900,
            letterSpacing:"-0.04em", color:"var(--d)",
            lineHeight:1.08, marginBottom:14,
          }}>
            Marketing, sorted.
          </h2>
          <p className="fb" style={{
            fontSize:"clamp(15px,1.7vw,17px)", color:"var(--d)", opacity:0.5,
            maxWidth:500, lineHeight:1.7, margin:"0 auto 56px",
          }}>
            <em>Mate</em> handles the thinking. You stay in control. Be as hands-on or hands-off as suits your business.
          </p>

          {/* Onboard — solo top card */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:0 }}>
            <motion.div
              initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }} transition={{ duration:0.6 }}
              className="hiw-card"
              style={{ maxWidth:380, width:"100%", textAlign:"left" }}
            >
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
                <span className="fb" style={{
                  fontSize:9.5, fontWeight:700, letterSpacing:"0.12em",
                  padding:"3px 10px", borderRadius:20,
                  background:"rgba(255,107,53,0.12)", color:"#993C1D",
                }}>ONE-TIME</span>
              </div>
              <h3 className="fh" style={{
                fontSize:24, fontWeight:900, letterSpacing:"-0.03em",
                color:"var(--d)", marginBottom:8, lineHeight:1.05,
              }}>Onboard</h3>
              <p className="fb" style={{
                fontSize:14, color:"rgba(41,43,45,0.55)", lineHeight:1.5,
              }}>
                <em>Mate</em> learns your business in minutes.
              </p>
              <div className="hiw-detail">
                <ul style={{ listStyle:"none", padding:0, margin:0 }}>
                  {[
                    "Short conversation, not a form",
                    <>Tells <em>Mate</em> who you are, what you do, who buys from you</>,
                    "Each onboarding is unique — no templates",
                  ].map((item, i) => (
                    <li key={i} className="fb" style={{
                      fontSize:13, lineHeight:1.5, padding:"4px 0",
                      color:"rgba(41,43,45,0.65)", display:"flex", gap:8,
                    }}>
                      <span style={{ opacity:0.5, flexShrink:0 }}>—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Connector arrow */}
          <motion.div
            initial={{ opacity:0, scaleY:0 }} whileInView={{ opacity:1, scaleY:1 }}
            viewport={{ once:true }} transition={{ delay:0.2, duration:0.6 }}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", margin:"22px 0 10px", transformOrigin:"top" }}
          >
            <div style={{
              width:1.5, height:38,
              background:"linear-gradient(to bottom, transparent, #ff6b35)",
              opacity:0.5,
            }} />
            <div style={{ color:"var(--o)", fontSize:14, lineHeight:1, opacity:0.7, marginTop:-2 }}>▼</div>
          </motion.div>

          {/* Cycle label */}
          <p className="fb" style={{
            fontSize:10, fontWeight:700, letterSpacing:"0.18em",
            textTransform:"uppercase", color:"rgba(41,43,45,0.32)",
            margin:"6px 0 22px",
          }}>
            Then the monthly cycle begins
          </p>

          {/* 3 cycle cards */}
          <div className="hiw-grid">
            {[
              {
                title:"Strategise",
                tag:<><em>Mate</em> drafts your plan. You shape it.</>,
                items:[
                  "Recommended channels, ranked by impact",
                  "90-day content calendar",
                  "Competitor overview",
                  "Quick wins to start",
                ],
                featured:false,
              },
              {
                title:"Execute",
                tag:<><em>Mate</em> does the heavy lifting.</>,
                items:[
                  "Weekly task lists",
                  "Ready-made content drafts",
                  "Reminders, nudges, trend alerts",
                  "Approve, tweak or rewrite — your call",
                ],
                featured:false,
              },
              {
                title:"Collect",
                tag:<><em>Mate</em> learns. Your strategy gets sharper.</>,
                items:[
                  "Tracks what worked, what didn't",
                  "Refines next month's plan automatically",
                  "Smarter every cycle",
                ],
                featured:true,
              },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay:0.1 + i*0.08, duration:0.55 }}
                className={`hiw-card${step.featured ? " featured" : ""}`}
                style={{ minHeight:200, textAlign:"left" }}
              >
                <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
                  <span className="fb" style={{
                    fontSize:9.5, fontWeight:700, letterSpacing:"0.12em",
                    padding:"3px 10px", borderRadius:20,
                    background: step.featured ? "rgba(255,255,255,0.2)" : "rgba(41,43,45,0.06)",
                    color: step.featured ? "#fff" : "rgba(41,43,45,0.55)",
                  }}>CYCLE</span>
                </div>
                <h3 className="fh" style={{
                  fontSize:22, fontWeight:900, letterSpacing:"-0.03em",
                  color: step.featured ? "#fff" : "var(--d)",
                  marginBottom:8, lineHeight:1.05,
                }}>{step.title}</h3>
                <p className="fb" style={{
                  fontSize:13.5, lineHeight:1.5,
                  color: step.featured ? "rgba(255,255,255,0.85)" : "rgba(41,43,45,0.55)",
                }}>
                  {step.tag}
                </p>
                <div className="hiw-detail">
                  <ul style={{ listStyle:"none", padding:0, margin:0 }}>
                    {step.items.map((item, j) => (
                      <li key={j} className="fb" style={{
                        fontSize:13, lineHeight:1.5, padding:"4px 0",
                        color: step.featured ? "rgba(255,255,255,0.92)" : "rgba(41,43,45,0.65)",
                        display:"flex", gap:8,
                      }}>
                        <span style={{ opacity:0.5, flexShrink:0 }}>—</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Loop indicator */}
          <motion.div
            initial={{ opacity:0 }} whileInView={{ opacity:1 }}
            viewport={{ once:true }} transition={{ delay:0.4, duration:0.6 }}
            style={{
              display:"flex", alignItems:"center", justifyContent:"center",
              marginTop:24, gap:14,
            }}
          >
            <div style={{ flex:1, maxWidth:140, height:1, background:"rgba(41,43,45,0.08)" }} />
            <span className="fb" style={{
              fontSize:11, color:"var(--o)", fontStyle:"italic",
              display:"inline-flex", alignItems:"center", gap:6,
            }}>
              ↺ gets smarter every cycle
            </span>
            <div style={{ flex:1, maxWidth:140, height:1, background:"rgba(41,43,45,0.08)" }} />
          </motion.div>

        </motion.div>
      </section>

      {/* ── Waitlist ── */}
      <section id="waitlist" style={{
        position:"relative", zIndex:1, minHeight:"60vh",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"80px 24px 160px", textAlign:"center",
      }}>
        <div style={{
          position:"absolute", inset:"8%",
          background:"radial-gradient(ellipse at center, rgba(255,107,53,0.05) 0%, transparent 70%)",
          pointerEvents:"none", borderRadius:40,
        }} />

        <motion.p className="fb"
          initial={{ opacity:0, y:12 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ duration:0.6 }}
          style={{ fontSize:11, fontWeight:600, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--o)", marginBottom:18 }}
        >Early Access</motion.p>

        <motion.h2 className="fh"
          initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ delay:0.08, duration:0.8, ease:[0.22,1,0.36,1] }}
          style={{ fontSize:"clamp(28px,5vw,52px)", fontWeight:900, letterSpacing:"-0.04em", color:"var(--d)", marginBottom:14, lineHeight:1.08 }}
        >Be first in the door.</motion.h2>

        <motion.p className="fb"
          initial={{ opacity:0, y:14 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ delay:0.14, duration:0.7 }}
          style={{ fontSize:"clamp(15px,1.7vw,18px)", color:"var(--d)", opacity:0.48, maxWidth:390, lineHeight:1.7, marginBottom:44 }}
        >Join the waitlist for early access, founder pricing, and updates as we launch.</motion.p>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.form key="form"
              initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, scale:0.96 }}
              transition={{ delay:0.18, duration:0.7, ease:[0.22,1,0.36,1] }}
              onSubmit={handleSubmit}
              style={{ width:"100%", maxWidth:430, display:"flex", flexDirection:"column", gap:12 }}
            >
              {[
                { key:"email",   placeholder:"Email address *",              type:"email", required:true  },
                { key:"name",    placeholder:"Your name (optional)",         type:"text",  required:false },
                { key:"company", placeholder:"Business or trade (optional)", type:"text",  required:false },
              ].map(({ key, placeholder, type, required }) => (
                <input key={key} type={type} placeholder={placeholder} required={required}
                  value={formState[key]}
                  onFocus={() => setFocused(key)} onBlur={() => setFocused(null)}
                  onChange={e => setFormState(s => ({ ...s, [key]: e.target.value }))}
                  style={{
                    width:"100%", padding:"14px 20px", borderRadius:13,
                    border:`1.5px solid ${focused===key ? "var(--o)" : "#e0e0e0"}`,
                    background:"#fff", fontSize:15, color:"var(--d)",
                    boxShadow: focused===key ? "0 0 0 3px rgba(255,107,53,0.1)" : "0 2px 8px rgba(0,0,0,0.04)",
                    transition:"border-color 0.18s, box-shadow 0.18s",
                  }}
                />
              ))}
              <motion.button type="submit"
                disabled={submitting}
                whileHover={!submitting ? { scale:1.02, background:"#e85e28" } : {}}
                whileTap={!submitting ? { scale:0.97 } : {}}
                style={{
                  marginTop:4, padding:"15px 28px", borderRadius:13, border:"none",
                  background:"var(--o)", color:"#fff", fontSize:15, fontWeight:700,
                  fontFamily:"var(--fb)", letterSpacing:"0.04em", textTransform:"uppercase",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                  boxShadow:"0 4px 24px rgba(255,107,53,0.3)", transition:"background 0.18s, opacity 0.18s",
                }}
              >{submitting ? "Joining..." : "Join the waitlist →"}</motion.button>
              {error && (
                <p className="fb" style={{ fontSize:13, color:"#c0392b", marginTop:4, fontWeight:500 }}>
                  {error}
                </p>
              )}
              <p className="fb" style={{ fontSize:12, color:"var(--d)", opacity:0.3, marginTop:2 }}>
                No spam, ever. Unsubscribe anytime.
              </p>
            </motion.form>
          ) : (
            <motion.div key="success"
              initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              transition={{ duration:0.6, ease:[0.22,1,0.36,1] }}
              style={{
                maxWidth:380, padding:"44px 40px", background:"#fff", borderRadius:24,
                boxShadow:"0 8px 40px rgba(0,0,0,0.06)",
                border:"1.5px solid rgba(255,107,53,0.14)", textAlign:"center",
              }}
            >
              <div style={{ fontSize:42, marginBottom:16 }}>🎉</div>
              <h3 className="fh" style={{ fontSize:24, fontWeight:900, color:"var(--d)", letterSpacing:"-0.04em", marginBottom:10 }}>
                You're on the list.
              </h3>
              <p className="fb" style={{ fontSize:15, color:"var(--d)", opacity:0.5, lineHeight:1.65 }}>
                We'll be in touch with early access and founder pricing. Watch your inbox.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Footer */}
      <footer style={{
        position:"relative", zIndex:1, padding:"28px 40px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        borderTop:"1px solid rgba(41,43,45,0.08)", flexWrap:"wrap", gap:12,
      }}>
        <span className="fh" style={{ fontSize:16, fontWeight:900, letterSpacing:"-0.04em", color:"var(--d)" }}>MarketMate</span>
        <span className="fb" style={{ fontSize:12, color:"var(--d)", opacity:0.28 }}>
          © {new Date().getFullYear()} MarketMate. All rights reserved.
        </span>
      </footer>
    </>
  );
}
