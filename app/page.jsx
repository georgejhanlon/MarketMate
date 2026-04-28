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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.email) return;
    setSubmitted(true);
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
          letter-spacing: -0.045em;
          line-height: 1;
          white-space: nowrap;
        }
        .reel-item.role     { color: var(--d); }
        .reel-item.everybody { color: var(--o); font-size: clamp(44px, 9.5vw, 104px); letter-spacing: -0.05em; }

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
        <span className="fh" style={{ fontSize:20, fontWeight:900, letterSpacing:"-0.04em", color:"var(--d)" }}>
          MarketMate
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
        <motion.p
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.1, duration:0.6 }}
          className="fb"
          style={{ fontSize:11, fontWeight:600, letterSpacing:"0.22em", textTransform:"uppercase", color:"var(--o)", marginBottom:36 }}
        >
          MarketMate · Coming Soon
        </motion.p>

        <motion.h1
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.2, duration:0.7, ease:[0.22,1,0.36,1] }}
          className="fh"
          style={{
            fontSize:"clamp(32px,6.5vw,80px)",
            fontWeight:900, letterSpacing:"-0.04em",
            color:"var(--o)", lineHeight:1.04, marginBottom:16,
          }}
        >
          MarketMate is for…
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

      {/* ── Meet Mate ── */}
      <section style={{
        position:"relative", zIndex:1,
        display:"flex", flexDirection:"column", alignItems:"center",
        padding:"40px 24px 120px",
      }}>
        <motion.div
          initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true, margin:"-60px" }}
          transition={{ duration:0.9, ease:[0.22,1,0.36,1] }}
          style={{
            background:"#fff", borderRadius:28,
            border:"1.5px solid rgba(255,107,53,0.1)",
            padding:"clamp(32px,5vw,52px) clamp(28px,5vw,56px)",
            maxWidth:680, width:"100%",
            boxShadow:"0 8px 52px rgba(0,0,0,0.055)",
          }}
        >
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:36 }}>
            <div style={{
              width:52, height:52, borderRadius:16, background:"var(--o)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 4px 18px rgba(255,107,53,0.32)", flexShrink:0, fontSize:22, color:"#fff",
            }}>✦</div>
            <div>
              <div className="fh" style={{ fontWeight:900, fontSize:22, color:"var(--d)", letterSpacing:"-0.04em" }}>Meet Mate</div>
              <div className="fb" style={{ fontSize:13, color:"var(--d)", opacity:0.38, marginTop:2 }}>Your AI marketing agent</div>
            </div>
            <div className="fb" style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--d)", opacity:0.35, fontWeight:500 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#4caf7d" }} />
              Online
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { from:"user", text:"I'm a plumber in Leeds. I never have time for marketing." },
              { from:"mate", text:"That's exactly what I'm here for. Tell me about your work — We'll put together a strategy, and execute it together. Updated and refined every month." },
              { from:"user", text:"What do you actually need from me?" },
              { from:"mate", text:"Just a few minutes to get set up. After that, I run in the background, and we check in when you're ready to market!" },
            ].map((msg, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:8 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay:i*0.09, duration:0.45 }}
                className="fb"
                style={{
                  alignSelf: msg.from==="mate" ? "flex-start" : "flex-end",
                  maxWidth:"82%", padding:"13px 18px", borderRadius:18,
                  borderBottomLeftRadius:  msg.from==="mate" ? 4 : 18,
                  borderBottomRightRadius: msg.from==="user" ? 4 : 18,
                  background: msg.from==="mate" ? "var(--o)" : "#f0f0f0",
                  color:      msg.from==="mate" ? "#fff" : "var(--d)",
                  fontSize:15, lineHeight:1.55,
                }}
              >
                {msg.text}
                {i===3 && <span className="cur" />}
              </motion.div>
            ))}
          </div>

          <div style={{
            display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(100px,1fr))",
            gap:10, marginTop:36, paddingTop:28, borderTop:"1px solid rgba(41,43,45,0.07)",
          }}>
            {[
              {icon:"✍️",label:"Content"},{icon:"🔍",label:"SEO"},
              {icon:"📱",label:"Social"},{icon:"📧",label:"Email"},
              {icon:"📊",label:"Reports"},
            ].map(({icon,label}) => (
              <div key={label} style={{ textAlign:"center", padding:"13px 8px", borderRadius:12, background:"rgba(255,107,53,0.05)" }}>
                <div style={{ fontSize:18, marginBottom:5 }}>{icon}</div>
                <div className="fb" style={{ fontSize:12, color:"var(--d)", opacity:0.5, fontWeight:600 }}>{label}</div>
              </div>
            ))}
          </div>
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
                whileHover={{ scale:1.02, background:"#e85e28" }} whileTap={{ scale:0.97 }}
                style={{
                  marginTop:4, padding:"15px 28px", borderRadius:13, border:"none",
                  background:"var(--o)", color:"#fff", fontSize:15, fontWeight:700,
                  fontFamily:"var(--fb)", letterSpacing:"0.04em", textTransform:"uppercase",
                  cursor:"pointer", boxShadow:"0 4px 24px rgba(255,107,53,0.3)", transition:"background 0.18s",
                }}
              >Join the waitlist →</motion.button>
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
