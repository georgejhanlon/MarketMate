"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────────────
   PASSWORD GATE
   Client-side only — anyone reading the JS source can find this. Fine for
   a demo gate; not security. If real protection is needed later, move to
   a server-side check (Vercel Edge function or middleware).
   ───────────────────────────────────────────────────────────────────────── */
const DEMO_PASSWORD = "DemoKey";
const STORAGE_KEY = "mm_demo_unlocked";

/* ─────────────────────────────────────────────────────────────────────────
   ACCOUNT MANAGER (you)
   ───────────────────────────────────────────────────────────────────────── */
const ACCOUNT_MANAGER = {
  name: "George Hanlon",
  role: "Founder | Your Account Mate",
  email: "george@getmarketmate.co.uk",
  initials: "GH",
  photo: null, // set to "/george.jpg" once hosted
};

/* ─────────────────────────────────────────────────────────────────────────
   Mate's question script (unchanged from v2)
   ───────────────────────────────────────────────────────────────────────── */

const SCRIPT = [
  {
    id: "q1",
    ask: "Right, before we get into anything — tell me about the business. What do you do, and where are you based?",
    reply: (a) => {
      const text = a.toLowerCase();
      if (/(family|wife|husband|brother|son|daughter|dad)/.test(text))
        return `A family-run thing — love that. Always a different feel to family businesses.`;
      if (/(year|years)/.test(text))
        return `Sounds like you've been at it a while. Good — means you know your customer.`;
      return `Nice. Already getting a feel for it.`;
    },
    followup: {
      condition: (a) => a.length < 40,
      ask: "Give me a bit more — how long have you been going, just you or a team?",
      reply: () => `That helps, thanks.`,
    },
  },
  {
    id: "q2",
    ask: "Who do you usually work with? What sort of customers come to you?",
    reply: (a) => {
      const text = a.toLowerCase();
      if (/(local|nearby|area)/.test(text))
        return `Local customers — that's the sweet spot for what we do, by the way. Loads we can do there.`;
      if (/(business|b2b|company|companies)/.test(text))
        return `B2B — interesting. Different game to consumer, but no less work to do.`;
      return `OK, that's clearer now.`;
    },
    followup: {
      condition: (a) => a.length < 40,
      ask: "And do they tend to find you the same way each time, or is it a mix?",
      reply: () => `Useful to know.`,
    },
  },
  {
    id: "q3",
    ask: "What are you doing for marketing at the moment? Be honest — anything actually working?",
    reply: (a) => {
      const text = a.toLowerCase();
      if (/(nothing|not much|not really|barely|hardly)/.test(text))
        return `Honest answer, appreciate it. Plenty of room to work with then — and most of it's the easy stuff.`;
      if (/(facebook|insta|social)/.test(text))
        return `Social — yeah, it's where most people start. Mixed bag for results though, isn't it.`;
      if (/(google|search|seo)/.test(text))
        return `Google's where the real intent is. We can definitely lean into that.`;
      if (/(word of mouth|referral|recommend)/.test(text))
        return `Word of mouth's brilliant — but it's a hard thing to scale on its own. We can build round it.`;
      return `That's a fair starting point. Honestly, most businesses your size are in the same spot.`;
    },
  },
  {
    id: "q4",
    ask: "Last one. If you picked up one extra customer a week from this, what would that mean for you?",
    reply: (a) => {
      const text = a.toLowerCase();
      if (/(life|change|massive|huge|big)/.test(text))
        return `That's the kind of bar worth aiming for. Right — give me a moment, I'll put something together.`;
      if (/£|\$|pound|grand|k\b/.test(text))
        return `Concrete number — good. That's what makes this real. One sec, drafting now.`;
      return `Understood. That's the bar. Putting something together for you — give me a moment.`;
    },
  },
];

function shorten(text, max = 80) {
  if (!text) return "";
  const t = text.trim().replace(/\s+/g, " ");
  return t.length <= max ? t : t.slice(0, max - 1) + "…";
}

/* ─────────────────────────────────────────────────────────────────────────
   Industry detection — expanded
   ───────────────────────────────────────────────────────────────────────── */

function detectIndustry(answers) {
  const text = answers.join(" ").toLowerCase();

  // Trades
  if (/(plumb|boiler|leak|drain|heating|electric|wiring|sparky|builder|construction|roofer|carpenter|joiner|painter|decorator|gas|landscape)/.test(text)) return "trade";

  // Beauty
  if (/(salon|hair|barber|nails|beauty|colour|stylist|makeup|aesthetic|brow|lash|tan)/.test(text)) return "beauty";

  // Hospitality — split into restaurant vs cafe vs other
  if (/(restaurant|fine din|bistro|gastropub|chef|tasting menu)/.test(text)) return "restaurant";
  if (/(cafe|coffee shop|coffee house|barista|brunch spot)/.test(text)) return "cafe";
  if (/(bakery|kitchen|caterer|catering|food truck|deli|takeaway)/.test(text)) return "hospo";

  // Wellness
  if (/(yoga|pilates|fitness|gym|personal trainer|coach|therapist|nutrition|massage|physio)/.test(text)) return "wellness";

  // Creative
  if (/(photo|videograph|filmmaker|design|graphic|creative|studio|illustrator|brand designer)/.test(text)) return "creative";

  // Travel
  if (/(travel|trip|holiday|tour|cruise|vacation|travel counsel|travel agent)/.test(text)) return "travel";

  // Estate agent
  if (/(estate agent|realtor|property|lettings|sales agent|landlord)/.test(text)) return "estate";

  // Pet care
  if (/(dog walk|pet sit|cat sit|grooming|kennel|cattery|pet care|dog trainer)/.test(text)) return "petcare";

  // Shop / retail
  if (/(shop|boutique|retail|store|gift shop|florist|bookshop|bookstore)/.test(text)) return "retail";

  // Legal
  if (/(lawyer|solicitor|legal|barrister|conveyanc|paralegal|attorney)/.test(text)) return "legal";

  // Cars
  if (/(car deal|car sales|garage|mechanic|mot|autom|dealership|car wash)/.test(text)) return "cars";

  return "service";
}

function detectLocation(answers) {
  const text = answers.join(" ");
  const m = text.match(/(?:in|based in|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  return m ? m[1] : null;
}

/* ─────────────────────────────────────────────────────────────────────────
   STRATEGY content per industry
   ───────────────────────────────────────────────────────────────────────── */

const STRATEGY_BY_INDUSTRY = {
  trade: {
    diagnosis: "Most trade businesses leave money on the table by relying on word-of-mouth alone. Local search is where 70%+ of your future customers are looking — and most of your competitors are losing those leads.",
    pillars: [
      { title: "Own local search", body: "Google Business Profile is your number one channel. Weekly posts, photos from real jobs, and a system for asking for reviews after every job. This is the single highest-leverage thing you can do." },
      { title: "Show the work", body: "Before/after photos and short videos from real jobs. Posted to Instagram, Facebook, and dropped into your GBP. Builds trust at a glance — far more than a stock photo on a website." },
      { title: "Capture and follow up", body: "A simple system to capture every enquiry (call, text, email, form) and follow up within 5 minutes. The first to respond wins the job, full stop." },
    ],
    quickWins: [
      "Update your Google Business Profile with 10 recent photos this week",
      "Set up a one-line text template for review requests",
      "Add a 'WhatsApp us' button to your website",
    ],
  },
  beauty: {
    diagnosis: "Beauty businesses live and die on Instagram and word-of-mouth. The opportunity isn't more posts — it's a tighter loop between content, bookings, and retention.",
    pillars: [
      { title: "Content that converts", body: "Stop posting just for posts' sake. We focus on the three formats that actually drive bookings: transformation reels, behind-the-scenes process, and client testimonials. Twice a week, no more." },
      { title: "Local discovery", body: "Google Business Profile is criminally underused in beauty. Weekly photo posts, prompt review requests, and a clean booking link drive walk-up appointments from people searching nearby." },
      { title: "Retention loop", body: "Existing clients are 5x easier to rebook than new ones. Automated rebooking nudges 6 weeks after each appointment, plus a quarterly 'we miss you' campaign for lapsed clients." },
    ],
    quickWins: [
      "Reels series: 4 transformation videos this month",
      "Set up automatic rebooking reminders",
      "Update Google Business Profile with 10 fresh photos",
    ],
  },
  restaurant: {
    diagnosis: "Restaurants are won or lost in the 30 seconds someone spends deciding where to eat tonight. Your strategy is built around being the obvious answer in that 30 seconds — and giving people a reason to come back.",
    pillars: [
      { title: "Win local search", body: "A relentless Google Business Profile presence: daily photo updates, prompt review responses, and weekly 'what's on' posts. This is where 'where shall we eat?' gets answered." },
      { title: "Visual social", body: "Instagram and TikTok, twice weekly. Plate shots, room atmosphere, the people behind the pass. Locals follow local restaurants — give them shareable content." },
      { title: "Repeat business", body: "Every customer should hear from you at least monthly. Email signup at point-of-sale, a tasteful newsletter with one upcoming thing and one soft offer, plus birthday vouchers." },
    ],
    quickWins: [
      "Photograph 10 menu hero dishes this week",
      "Set up email capture at the till",
      "Reply to every Google review from the past 3 months",
    ],
  },
  cafe: {
    diagnosis: "Cafes win on routine. People don't choose where to get coffee — they default to it. Your strategy is about becoming the default for the right cluster of people in a tight radius around your door.",
    pillars: [
      { title: "Be the obvious local choice", body: "Google Business Profile with a steady stream of photos, weekly posts, and prompt review requests. Aim for 50+ Google reviews in the first quarter — this alone moves you up the local pack." },
      { title: "Visual rhythm on Instagram", body: "Three posts a week: one product (drinks, food), one mood (the room, the regulars), one behind-the-scenes (the team, the craft). Locals are following local — make it easy to share." },
      { title: "Loyalty without a punch card", body: "A simple email list with a monthly 'what's new this month' note. Plus a soft offer for first-time visitors who scan a QR code at the till. Quietly turns drop-ins into regulars." },
    ],
    quickWins: [
      "Take 20 great photos this week — drinks, food, room, team",
      "Set up a QR code at the till for email signup",
      "Ask 5 happy regulars to leave a Google review today",
    ],
  },
  hospo: {
    diagnosis: "Hospitality is hyper-local. Your customers are within a 1-mile radius and they decide where to eat in 30 seconds on their phone. The strategy is built around being the obvious answer in that 30 seconds.",
    pillars: [
      { title: "Win the local search moment", body: "Google Business Profile, daily updates, photos that look good at thumbnail size, and a relentless review-asking habit." },
      { title: "Visual social", body: "Instagram and TikTok, twice a week. Food shots, room shots, the people behind it." },
      { title: "Repeat business", body: "Email list signup at point-of-sale, monthly newsletter with a soft offer, and a birthday voucher system." },
    ],
    quickWins: [
      "Photograph your full menu professionally this week",
      "Set up a simple email capture at the till",
      "Reply to every Google review from the past 3 months",
    ],
  },
  wellness: {
    diagnosis: "Wellness businesses sell trust before they sell sessions. The strategy is about becoming the obvious local expert — content that demonstrates know-how, not content that shouts about offers.",
    pillars: [
      { title: "Authority content", body: "Short-form video where you actually teach something — one tip, one minute. Three a week on Instagram and TikTok. People book the person who already taught them something free." },
      { title: "Local SEO", body: "A proper Google Business Profile, weekly posts, and a steady stream of reviews. Most wellness practitioners do nothing here. You'll stand out fast." },
      { title: "Email is your engine", body: "A monthly email to your list with one practical thing, one client win, and one soft call-to-book." },
    ],
    quickWins: [
      "Film 3 short tip videos this week",
      "Set up a 'free first 15 minutes' offer on Google",
      "Send a 'what I'm working on this month' email to past clients",
    ],
  },
  creative: {
    diagnosis: "Creative businesses suffer from being too modest. Your work speaks for itself — but only if people actually see it. The strategy is built around getting your portfolio in front of decision-makers, repeatedly.",
    pillars: [
      { title: "Showcase the process", body: "Behind-the-scenes content outperforms finished work for visibility. Three pieces a week mixing process and finished pieces. Instagram, LinkedIn, and a portfolio that updates monthly." },
      { title: "Direct outreach", body: "Cold outreach to specific local businesses, with a tailored angle for each. Five a week. Most creatives won't do this — which is exactly why it works." },
      { title: "Repeat & referral", body: "A simple system to ask every happy client for one referral. Plus quarterly check-ins with past clients." },
    ],
    quickWins: [
      "Record a 60-second 'how this got made' video",
      "Send 5 personalised outreach messages this week",
      "Update your portfolio's homepage with three latest pieces",
    ],
  },
  travel: {
    diagnosis: "Travel is the most relationship-driven business there is. People book with someone they trust, not the cheapest URL. Your strategy is built on becoming the friend-with-a-passport for a specific tribe of people, then making it ridiculously easy for them to bring their friends.",
    pillars: [
      { title: "Be the expert in a niche", body: "You can't be 'a travel consultant' — that competes with the internet. You need to be 'the person for honeymoons in the Maldives' or 'the person for multigenerational Italy trips'. Pick a tribe and own the content space for them." },
      { title: "Trip stories that sell", body: "Once-a-week long-form content — Instagram carousels, blog posts, or an email — telling the story of one recent trip you arranged. Photos, the brief, what you booked, what surprised them. This is the highest-converting content in travel." },
      { title: "The referral engine", body: "Every happy client knows three other people planning a trip. After every successful trip, a personal message asking for a referral, plus a small thank-you incentive. Travel's word-of-mouth runs on this." },
    ],
    quickWins: [
      "Pick your travel niche this week — write it down",
      "Draft your first trip story (carousel + email)",
      "Send personal referral requests to your last 5 clients",
    ],
  },
  estate: {
    diagnosis: "Estate agency is local, fast-moving, and reputation-led. The strategy isn't about more leads — it's about being so visibly active in your area that vendors think of you first when they're ready to sell, and buyers trust your shortlists.",
    pillars: [
      { title: "Hyperlocal authority", body: "Become the source of truth for the streets you cover. Weekly posts on what's selling, what's listed, what's coming up. Property tours on Instagram and TikTok. The agent who shows up consistently wins the next instruction." },
      { title: "Vendor pipeline", body: "Most agents only talk to people who are selling now. We build a 6-12 month pipeline — the homeowners thinking about it but not ready. A monthly 'state of the local market' email to your contact list keeps you top of mind for the moment they're ready." },
      { title: "Reviews that matter", body: "Google and AllAgents reviews are the trust signal vendors check before instructing you. We ask every completed seller and buyer for one — automated, polite, hard to refuse. Aim for 50+ in 12 months." },
    ],
    quickWins: [
      "Film walkthroughs of your top 3 listings this week",
      "Send a monthly 'local market' email draft for review",
      "Request reviews from your last 10 completions",
    ],
  },
  petcare: {
    diagnosis: "Pet care lives entirely on trust. Owners need to know you'll treat their dog like family — and that's earned through visibility, social proof, and genuine warmth, not promotional offers.",
    pillars: [
      { title: "Local trust signals", body: "Google Business Profile is essential — pet owners search 'dog walker near me' and pick from the top three. Photos of you with happy dogs, prompt review requests, and weekly updates. This is your highest-leverage channel." },
      { title: "Pack content", body: "Instagram is built for this. Three posts a week — your dogs out walking, training tips, behind-the-scenes from your day. Pet owners follow local pet accounts religiously, and word travels fast in dog-walking communities." },
      { title: "Owner referral loop", body: "Every regular client knows other dog owners in your area. A small referral incentive (£20 off, a free walk) plus a once-a-quarter 'are your friends looking?' nudge keeps your pipeline filling itself." },
    ],
    quickWins: [
      "Get 5 photos with happy dogs this week — clients will love seeing them",
      "Ask your last 5 regular clients for a Google review",
      "Set up a simple 'refer a friend' offer",
    ],
  },
  retail: {
    diagnosis: "Independent shops compete with Amazon on convenience, which is unwinnable, or on personality, which is. Your strategy is built around being the local destination people come to *because of* you — not despite you.",
    pillars: [
      { title: "Be the personality", body: "Your face, your voice, your taste. Three short Instagram posts a week — new in, behind the till, a recommendation. Shops with a personality outperform polished brand accounts every time." },
      { title: "Local discoverability", body: "Google Business Profile with rich photos and weekly 'what's new' posts. Tourists and new locals search this — most independent shops have nothing here, which is your opening." },
      { title: "Quiet email engine", body: "An email list of locals who love what you do. Once a month — a quick note about new stock, an event, a little behind-the-scenes. The most profitable channel a shop has, and almost no one uses it well." },
    ],
    quickWins: [
      "Film 3 'new in this week' short videos",
      "Update your Google Business Profile with current photos",
      "Add a 'join our list' card by the till",
    ],
  },
  legal: {
    diagnosis: "Legal services are bought in moments of stress and necessity. Your customer doesn't read your blog — they Google a problem at 11pm and pick the firm that looks most credible in 30 seconds. The strategy is about being unmistakably the right choice in those 30 seconds.",
    pillars: [
      { title: "Authority on the page", body: "A clean Google Business Profile, professional reviews from real clients, and a tight set of practice-area pages on your site that rank for the searches your clients actually make. Substance over volume — three excellent pages beat thirty mediocre ones." },
      { title: "Quiet reassurance content", body: "LinkedIn and your blog: monthly posts answering the questions clients actually ask in initial consultations. Not 'thought leadership' — practical answers to common worries. This is what gets shared by accountants, IFAs, and other referrers." },
      { title: "Referrer relationships", body: "80% of legal work in many specialisms comes from professional referrers. A quarterly check-in with accountants, IFAs, mortgage brokers, and wealth managers in your area — coffee, lunch, or just an email — is the highest-leverage thing you can do." },
    ],
    quickWins: [
      "Audit your top 3 practice-area pages — are they answering real questions?",
      "Request reviews from your last 5 happy clients",
      "Send a 'catching up' note to 5 professional referrers",
    ],
  },
  cars: {
    diagnosis: "Used car sales is a trust game played in public. Buyers research for weeks before they walk in — your job isn't to convince them on the day, it's to be the dealer they've already decided to visit.",
    pillars: [
      { title: "Stock that sells itself", body: "Every car listed properly: 30+ photos, video walkaround, full spec, honest condition notes. Listings get found on AutoTrader and Cargurus, but the ones that actually sell are the ones that pre-answer every question a buyer has." },
      { title: "Local social proof", body: "Google reviews are the single biggest trust signal in used cars. Every successful sale gets a polite, automated review request. Aim for 100+ reviews in 12 months — this single change can lift conversion by 20%+." },
      { title: "The 'still available?' machine", body: "Most enquiries don't buy that day — they buy 4-8 weeks later when something else falls through. We build a polite follow-up sequence: 'still looking?' messages at week 2, 4, and 8. Recovers a remarkable amount of dropped business." },
    ],
    quickWins: [
      "Improve photos on your top 5 listings this week",
      "Set up an automated review request for sold cars",
      "Add a 4-week follow-up sequence for unsold leads",
    ],
  },
  service: {
    diagnosis: "Most service businesses get stuck on 'what should I post?' The honest answer is: less than you think, but more consistently. The strategy is about a small set of high-leverage habits, done weekly, forever.",
    pillars: [
      { title: "Local visibility", body: "Google Business Profile is the highest-leverage channel for any local service business. Weekly updates, prompt reviews, and a steady stream of real photos." },
      { title: "Authority content", body: "Short, useful posts that show you know what you're doing. Two a week, mixed across Instagram and LinkedIn depending on your customer base." },
      { title: "Capture & follow up", body: "Every enquiry gets a same-day reply. Past customers hear from you quarterly with something genuinely useful." },
    ],
    quickWins: [
      "Post your first Google Business Profile update this week",
      "Set up a one-line review request template",
      "Email your past 10 customers with a useful update",
    ],
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   useStreamedText hook
   ───────────────────────────────────────────────────────────────────────── */

function useStreamedText(target, speedMs = 14, active = true) {
  const [output, setOutput] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) return;
    setOutput("");
    setDone(false);
    if (!target) {
      setDone(true);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOutput(target.slice(0, i));
      if (i >= target.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speedMs);
    return () => clearInterval(id);
  }, [target, speedMs, active]);

  return { output, done };
}

function MateMessage({ text, speedMs = 14, onDone, instant = false }) {
  const [showCursor, setShowCursor] = useState(true);
  const { output, done } = useStreamedText(text, speedMs, !instant);

  useEffect(() => {
    if (instant) {
      setShowCursor(false);
      onDone && onDone();
    }
  }, [instant, onDone]);

  useEffect(() => {
    if (done && !instant) {
      const t = setTimeout(() => {
        setShowCursor(false);
        onDone && onDone();
      }, 240);
      return () => clearTimeout(t);
    }
  }, [done, instant, onDone]);

  return (
    <div className="msg msg-mate">
      <div className="msg-bubble msg-bubble-mate">
        {instant ? text : output}
        {!instant && showCursor && <span className="cursor" />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────────────────────── */

export default function DemoPage() {
  // Gate state: 'locked' | 'unlocked'
  const [gate, setGate] = useState("checking");

  // Portal: 'boot' | 'chat' | 'loading-strategy' | 'strategy' | 'loading-dashboard' | 'dashboard'
  const [portal, setPortal] = useState("boot");

  const [messages, setMessages] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [followupActive, setFollowupActive] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [mateThinking, setMateThinking] = useState(false);
  const [answers, setAnswers] = useState([]);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [followingScroll, setFollowingScroll] = useState(true);

  const [panelOpen, setPanelOpen] = useState(false);

  /* Check session storage for unlock — wrapped in try/catch because some
     sandboxed environments (incognito with strict settings, in-app browsers,
     embedded previews) block storage APIs and would otherwise leave the
     gate stuck on "checking". */
  useEffect(() => {
    let unlocked = false;
    try {
      if (typeof window !== "undefined") {
        unlocked = sessionStorage.getItem(STORAGE_KEY) === "1";
      }
    } catch (e) {
      unlocked = false;
    }
    setGate(unlocked ? "unlocked" : "locked");
  }, []);

  /* Initial Mate message when chat portal opens */
  useEffect(() => {
    if (portal === "chat" && messages.length === 0) {
      setMessages([{ from: "mate", text: SCRIPT[0].ask, key: "intro" }]);
      setTimeout(() => inputRef.current?.focus(), 600);
    }
  }, [portal, messages.length]);

  /* Auto-scroll within chat */
  useEffect(() => {
    if (!followingScroll) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  });

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setFollowingScroll(distanceFromBottom < 80);
  };

  /* Send a message */
  const handleSend = async () => {
    const text = userInput.trim();
    if (!text || mateThinking || portal !== "chat") return;

    const newAnswers = [...answers, text];
    setAnswers(newAnswers);
    setUserInput("");

    setMessages((m) => [...m, { from: "user", text, key: `u-${m.length}` }]);

    setMateThinking(true);
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));
    setMateThinking(false);

    const currentQ = SCRIPT[questionIndex];
    const shouldFollowup = !followupActive && currentQ.followup && currentQ.followup.condition(text);

    if (shouldFollowup) {
      setMessages((m) => [...m, { from: "mate", text: currentQ.followup.ask, key: `m-fu-${m.length}` }]);
      setFollowupActive(true);
      return;
    }

    const replyText = followupActive ? currentQ.followup.reply(text) : currentQ.reply(text);
    setMessages((m) => [...m, { from: "mate", text: replyText, key: `m-r-${m.length}` }]);

    await new Promise((r) => setTimeout(r, replyText.length * 14 + 600));

    setFollowupActive(false);

    if (questionIndex < SCRIPT.length - 1) {
      const nextQ = SCRIPT[questionIndex + 1];
      setMessages((m) => [...m, { from: "mate", text: nextQ.ask, key: `m-q-${m.length}` }]);
      setQuestionIndex((i) => i + 1);
    } else {
      // Done — go to loading screen, then strategy
      setTimeout(() => setPortal("loading-strategy"), 1200);
    }
  };

  /* Presenter shortcuts */
  useEffect(() => {
    const onKey = (e) => {
      const cmd = e.metaKey || e.ctrlKey;
      if (!cmd) return;
      if (e.key.toLowerCase() === "r") { e.preventDefault(); window.location.reload(); }
      if (e.key === "/") { e.preventDefault(); setPanelOpen((o) => !o); }
      if (e.key === "ArrowRight") { e.preventDefault(); skipAhead(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portal]);

  const skipAhead = () => {
    if (portal === "boot") {
      setPortal("chat");
    } else if (portal === "chat") {
      const placeholders = [
        "Family-run plumbing business in Buckinghamshire, mostly emergency callouts, been at it 15 years.",
        "Mostly homeowners, 35-65, anyone who's had a leak at 11pm on a Sunday.",
        "Bit of word-of-mouth, a tired website, some Facebook posts. Honestly, not really, no.",
        "Probably £150-200 a week extra. Over a year that's a holiday and then some.",
      ];
      setAnswers(placeholders);
      setTimeout(() => setPortal("loading-strategy"), 200);
    } else if (portal === "loading-strategy") {
      setPortal("strategy");
    } else if (portal === "strategy") {
      setPortal("loading-dashboard");
    } else if (portal === "loading-dashboard") {
      setPortal("dashboard");
    }
  };

  const goTo = (p) => setPortal(p);

  const industry = useMemo(() => detectIndustry(answers), [answers]);
  const location = useMemo(() => detectLocation(answers), [answers]);
  const strategy = STRATEGY_BY_INDUSTRY[industry] || STRATEGY_BY_INDUSTRY.service;

  /* ─── If gate not unlocked, show the gate ─── */
  if (gate === "checking") {
    return (
      <>
        <GlobalStyles />
        <div className="grain" />
        <div style={{
          position: "fixed", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: "var(--bg)", zIndex: 100,
        }} />
      </>
    );
  }

  if (gate === "locked") {
    return (
      <>
        <GlobalStyles />
        <div className="grain" />
        <PasswordGate onUnlock={() => {
          try {
            sessionStorage.setItem(STORAGE_KEY, "1");
          } catch (e) {
            // storage blocked — gate will simply re-prompt next visit, which is fine
          }
          setGate("unlocked");
        }} />
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div className="grain" />

      {portal !== "boot" && (
        <button
          className="presenter-btn"
          onClick={() => setPanelOpen((o) => !o)}
          title="Presenter controls (⌘/)"
        >
          <span style={{ fontSize: 12, opacity: 0.8 }}>⌘</span>
        </button>
      )}

      <PresenterPanel
        open={panelOpen}
        portal={portal}
        onClose={() => setPanelOpen(false)}
        onJumpTo={goTo}
        onSkip={skipAhead}
      />

      <AnimatePresence mode="wait">
        {portal === "boot" && <BootScreen key="boot" onBegin={() => setPortal("chat")} />}

        {portal === "chat" && (
          <ChatPortal
            key="chat"
            scrollRef={scrollRef}
            handleScroll={handleScroll}
            messages={messages}
            mateThinking={mateThinking}
            inputRef={inputRef}
            userInput={userInput}
            setUserInput={setUserInput}
            handleSend={handleSend}
            followingScroll={followingScroll}
            setFollowingScroll={setFollowingScroll}
          />
        )}

        {portal === "loading-strategy" && (
          <LoadingScreen
            key="loading-strategy"
            title="Building your strategy"
            steps={[
              { label: "Reading your answers", duration: 500 },
              { label: "Analysing your industry", duration: 1100 },
              { label: "Pulling local search data", duration: 1400 },
              { label: "Identifying quick wins", duration: 800 },
              { label: "Drafting recommendations", duration: 1000 },
            ]}
            onDone={() => setPortal("strategy")}
          />
        )}

        {portal === "strategy" && (
          <StrategyPortal
            key="strategy"
            strategy={strategy}
            location={location}
            onContinue={() => setPortal("loading-dashboard")}
          />
        )}

        {portal === "loading-dashboard" && (
          <LoadingScreen
            key="loading-dashboard"
            title="Setting up your dashboard"
            steps={[
              { label: "Provisioning your workspace", duration: 600 },
              { label: "Building your content calendar", duration: 1200 },
              { label: "Drafting your first content", duration: 1600 },
              { label: "Loading your analytics", duration: 700 },
              { label: "Connecting your channels", duration: 900 },
            ]}
            onDone={() => setPortal("dashboard")}
          />
        )}

        {portal === "dashboard" && (
          <DashboardPortal
            key="dashboard"
            industry={industry}
            location={location}
            answers={answers}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PASSWORD GATE
   ───────────────────────────────────────────────────────────────────────── */

function PasswordGate({ onUnlock }) {
  const [val, setVal] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const submit = (e) => {
    e?.preventDefault();
    if (val === DEMO_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setTimeout(() => setError(false), 2400);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "var(--bg)", padding: 24, textAlign: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="fh"
        style={{
          fontSize: "clamp(36px, 6vw, 72px)",
          fontWeight: 900, letterSpacing: "-0.07em",
          color: "var(--o)", textTransform: "uppercase",
          lineHeight: 0.88, marginBottom: 28,
        }}
      >
        MARK<span style={{ letterSpacing: "-0.16em" }}>E</span>T<br/>MA<span style={{ letterSpacing: "-0.16em" }}>T</span>E
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="fb"
        style={{
          fontSize: 14, color: "var(--d-soft)",
          fontStyle: "italic", marginBottom: 28,
        }}
      >
        This demo's private. Pop the key in to take a look.
      </motion.p>

      <motion.form
        onSubmit={submit}
        animate={shaking ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: "flex", flexDirection: "column", gap: 12,
          width: "100%", maxWidth: 320,
        }}
      >
        <input
          type="password"
          placeholder="Demo key"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoFocus
          style={{
            width: "100%",
            padding: "14px 18px",
            borderRadius: 12,
            border: `1.5px solid ${error ? "#c0392b" : "var(--line)"}`,
            background: "white",
            fontSize: 15,
            color: "var(--d)",
            textAlign: "center",
            letterSpacing: "0.04em",
            transition: "border-color 0.18s, box-shadow 0.18s",
            boxShadow: error ? "0 0 0 4px rgba(192,57,43,0.1)" : "none",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "14px 20px",
            background: "var(--d)",
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Unlock
        </button>
      </motion.form>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 14,
              fontSize: 12,
              color: "#c0392b",
              fontWeight: 600,
            }}
          >
            That's not the key. Try again.
          </motion.p>
        )}
      </AnimatePresence>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.9, duration: 1 }}
        className="fb"
        style={{
          marginTop: 32, fontSize: 11.5,
          color: "var(--d-soft)", fontStyle: "italic",
        }}
      >
        Don't have one? Email george@getmarketmate.co.uk
      </motion.p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   LOADING SCREEN
   Steps tick through one by one. Last step holds until duration elapses,
   then onDone fires.
   ───────────────────────────────────────────────────────────────────────── */

function LoadingScreen({ title, steps, onDone }) {
  // Normalise steps: each becomes { label, duration }.
  // Strings get a default duration; objects pass through.
  const normalisedSteps = steps.map((s) =>
    typeof s === "string" ? { label: s, duration: 600 } : s
  );

  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState([]);

  useEffect(() => {
    const timers = [];
    let elapsed = 0;

    normalisedSteps.forEach((step, i) => {
      // Mark this step as active when the previous step's duration has passed
      timers.push(setTimeout(() => {
        if (i > 0) setCompleted((c) => [...c, i - 1]);
        setActiveStep(i);
      }, elapsed));
      elapsed += step.duration;
    });

    // Mark final step complete just before finishing
    timers.push(setTimeout(() => {
      setCompleted(normalisedSteps.map((_, i) => i));
    }, elapsed - 250));

    // Total duration finishes
    timers.push(setTimeout(onDone, elapsed));

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "var(--bg)", padding: 24,
      }}
    >
      {/* Spinning orbit animation */}
      <div className="orbit-wrap">
        <div className="orbit-core" />
        <div className="orbit-ring orbit-ring-1" />
        <div className="orbit-ring orbit-ring-2" />
        <div className="orbit-ring orbit-ring-3" />
      </div>

      <h2 className="fh" style={{
        marginTop: 48,
        fontSize: "clamp(28px, 4vw, 40px)",
        fontWeight: 900, letterSpacing: "-0.04em",
        color: "var(--d)", lineHeight: 1.1,
        textAlign: "center",
      }}>
        {title}
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ marginLeft: 4, display: "inline-block", color: "var(--o)" }}
        >…</motion.span>
      </h2>

      <div style={{
        marginTop: 36,
        display: "flex", flexDirection: "column",
        gap: 10,
        minWidth: 280,
        maxWidth: 360,
      }}>
        {normalisedSteps.map((step, i) => {
          const isDone = completed.includes(i);
          const isActive = activeStep === i && !isDone;
          const isPending = i > activeStep;

          return (
            <motion.div
              key={i}
              animate={{
                opacity: isPending ? 0.32 : 1,
              }}
              transition={{ duration: 0.4 }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                fontSize: 13.5,
                color: isActive ? "var(--d)" : "var(--d-soft)",
                fontWeight: isActive ? 600 : 500,
              }}
            >
              {/* Status icon */}
              <div style={{
                width: 16, height: 16, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isDone && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      width: 16, height: 16,
                      borderRadius: "50%",
                      background: "var(--o)",
                      color: "white",
                      fontSize: 9,
                      fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >✓</motion.div>
                )}
                {isActive && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{
                      width: 14, height: 14,
                      borderRadius: "50%",
                      border: "1.5px solid var(--line)",
                      borderTopColor: "var(--o)",
                    }}
                  />
                )}
                {isPending && (
                  <div style={{
                    width: 6, height: 6,
                    borderRadius: "50%",
                    background: "var(--d-soft)",
                    opacity: 0.4,
                  }} />
                )}
              </div>
              <span>{step.label}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   BOOT SCREEN
   ───────────────────────────────────────────────────────────────────────── */

function BootScreen({ onBegin }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed", inset: 0, zIndex: 10,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "var(--bg)", padding: 24, textAlign: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="fh"
        style={{
          fontSize: "clamp(48px, 9vw, 112px)",
          fontWeight: 900, letterSpacing: "-0.07em",
          color: "var(--o)", textTransform: "uppercase",
          lineHeight: 0.88, marginBottom: 36,
        }}
      >
        MARK<span style={{ letterSpacing: "-0.16em" }}>E</span>T<br/>MA<span style={{ letterSpacing: "-0.16em" }}>T</span>E
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.7 }}
        className="fb"
        style={{
          fontSize: "clamp(15px, 1.8vw, 19px)",
          color: "var(--d-soft)", fontStyle: "italic",
          marginBottom: 48, maxWidth: 500, lineHeight: 1.55,
        }}
      >
        Take the wheel for two minutes. Show me a business, and I'll show you what we'd do for it.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.7 }}
        onClick={onBegin}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        style={{
          padding: "20px 44px",
          background: "var(--d)", color: "white",
          border: "none", borderRadius: 100,
          fontSize: 15, fontWeight: 700,
          letterSpacing: "0.04em", textTransform: "uppercase",
          cursor: "pointer",
          boxShadow: "0 12px 36px -12px rgba(42,39,37,0.4)",
          display: "inline-flex", alignItems: "center", gap: 14,
        }}
      >
        <span>Begin demo</span>
        <span style={{ fontSize: 18, opacity: 0.7 }}>→</span>
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="fb"
        style={{
          marginTop: 36, fontSize: 12,
          color: "var(--d-soft)", fontStyle: "italic",
        }}
      >
        About 90 seconds, give or take
      </motion.p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   CHAT PORTAL
   ───────────────────────────────────────────────────────────────────────── */

function ChatPortal({
  scrollRef, handleScroll, messages, mateThinking,
  inputRef, userInput, setUserInput, handleSend,
  followingScroll, setFollowingScroll,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="portal-shell"
    >
      <div ref={scrollRef} onScroll={handleScroll} className="scroll-col">
        <div style={{ minHeight: "30vh" }} />
        <div className="stream">
          {messages.map((m) => {
            if (m.from === "user") {
              return (
                <motion.div
                  key={m.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="msg msg-user"
                >
                  <div className="msg-bubble msg-bubble-user">{m.text}</div>
                </motion.div>
              );
            }
            return <MateMessage key={m.key} text={m.text} speedMs={14} instant={m.instant} />;
          })}

          {mateThinking && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="msg msg-mate"
            >
              <div className="typing"><span /><span /><span /></div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {!followingScroll && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="jump-pill"
            onClick={() => {
              setFollowingScroll(true);
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
            }}
            aria-label="Jump to live"
          />
        )}
      </AnimatePresence>

      <div className="input-bar-wrap">
        <div className="input-bar">
          <input
            ref={inputRef}
            type="text"
            placeholder={mateThinking ? "Mate is thinking…" : "Type your answer…"}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            disabled={mateThinking}
            autoFocus
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!userInput.trim() || mateThinking}
          >→</button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   STRATEGY PORTAL
   ───────────────────────────────────────────────────────────────────────── */

function StrategyPortal({ strategy, location, onContinue }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="portal-shell"
      style={{ overflowY: "auto" }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "100px 40px 120px" }}>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          <span className="eyebrow">strategy · draft 1</span>

          <h1 className="fh" style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 900, letterSpacing: "-0.045em",
            color: "var(--d)", lineHeight: 1.04,
            marginTop: 18, marginBottom: 22,
          }}>
            Here's where I'd start{location ? <> for <span style={{ color: "var(--o)" }}>{location}</span></> : ""}.
          </h1>

          <p className="fb" style={{
            fontSize: 17, color: "var(--d-soft)",
            lineHeight: 1.65, marginBottom: 44,
          }}>
            {strategy.diagnosis}
          </p>
        </motion.div>

        {strategy.pillars.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.18, duration: 0.5 }}
            style={{ padding: "24px 0", borderTop: "1px dashed var(--line)" }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginBottom: 8 }}>
              <span className="fh" style={{ fontSize: 18, fontWeight: 900, color: "var(--o)" }}>0{i + 1}</span>
              <h3 className="fh" style={{
                fontSize: 24, fontWeight: 900, letterSpacing: "-0.025em", color: "var(--d)",
              }}>{p.title}</h3>
            </div>
            <p className="fb" style={{
              fontSize: 15.5, color: "var(--d-soft)",
              lineHeight: 1.65, paddingLeft: 36,
            }}>{p.body}</p>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          style={{
            marginTop: 28, padding: "24px 26px",
            background: "var(--cream)", borderRadius: 18,
            border: "1px solid rgba(255,107,53,0.18)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--d)", marginBottom: 10 }}>
            This week's quick wins
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {strategy.quickWins.map((w, i) => (
              <li key={i} className="fb" style={{
                fontSize: 14.5, padding: "7px 0",
                color: "var(--d-soft)", lineHeight: 1.55,
                display: "flex", gap: 10,
              }}>
                <span style={{ color: "var(--o)", fontWeight: 700 }}>✓</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          style={{
            marginTop: 56, paddingTop: 32,
            borderTop: "1px dashed var(--line)",
            display: "flex", justifyContent: "space-between",
            alignItems: "center", flexWrap: "wrap", gap: 18,
          }}
        >
          <span className="fb" style={{ fontSize: 14, color: "var(--d-soft)", fontStyle: "italic" }}>
            And here's how it lives day to day →
          </span>
          <button onClick={onContinue} className="primary-btn">
            Open your dashboard
            <span style={{ marginLeft: 12, opacity: 0.7 }}>→</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   DASHBOARD PORTAL
   ───────────────────────────────────────────────────────────────────────── */

function DashboardPortal({ industry, location, answers }) {
  const [section, setSection] = useState("home");
  const place = location || "your area";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="portal-shell"
      style={{ background: "var(--app-bg)" }}
    >
      <div className="app-frame">
        <aside className="app-sidebar">
          <div className="app-logo fh" style={{
            fontSize: 16, fontWeight: 900, letterSpacing: "-0.07em",
            color: "var(--o)", textTransform: "uppercase", lineHeight: 0.88,
            marginBottom: 28,
          }}>
            MARK<span style={{ letterSpacing: "-0.16em" }}>E</span>T<br/>MA<span style={{ letterSpacing: "-0.16em" }}>T</span>E
          </div>

          <nav className="app-nav">
            {[
              { id: "home", label: "Home", icon: "▤" },
              { id: "calendar", label: "Calendar", icon: "▦" },
              { id: "drafts", label: "Drafts", icon: "▥", badge: 3 },
              { id: "tasks", label: "Tasks", icon: "▢", badge: 2 },
              { id: "analytics", label: "Analytics", icon: "▤" },
              { id: "settings", label: "Settings", icon: "◔" },
            ].map((item) => (
              <button
                key={item.id}
                className={`app-nav-item ${section === item.id ? "active" : ""}`}
                onClick={() => setSection(item.id)}
              >
                <span className="app-nav-icon">{item.icon}</span>
                <span className="app-nav-label">{item.label}</span>
                {item.badge && <span className="app-nav-badge">{item.badge}</span>}
              </button>
            ))}
          </nav>

          <div className="app-nav-section-title">Coming soon</div>
          {["Brand Voice", "Customer Insights", "Competitor Watch", "Auto-Publish"].map((label) => (
            <button key={label} className="app-nav-item locked" disabled>
              <span className="app-nav-icon">◌</span>
              <span className="app-nav-label">{label}</span>
              <span className="app-nav-lock">soon</span>
            </button>
          ))}
        </aside>

        <div className="app-main">
          <header className="app-topbar">
            <div className="app-search">
              <span style={{ opacity: 0.5, marginRight: 10 }}>⌕</span>
              <input type="text" placeholder="Search drafts, tasks, anything…" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button className="app-icon-btn" title="Notifications">
                <span style={{ fontSize: 14 }}>◔</span>
                <span className="app-notif-dot" />
              </button>
              <AccountManagerPill />
            </div>
          </header>

          <div className="app-content">
            {section === "home" && <DashHome industry={industry} place={place} setSection={setSection} />}
            {section === "calendar" && <DashCalendar industry={industry} place={place} />}
            {section === "drafts" && <DashDrafts industry={industry} place={place} />}
            {section === "tasks" && <DashTasks industry={industry} />}
            {section === "analytics" && <DashAnalytics />}
            {section === "settings" && <DashSettings />}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ACCOUNT MANAGER PILL — fixed z-index for dropdown
   ───────────────────────────────────────────────────────────────────────── */

function AccountManagerPill() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", zIndex: open ? 9999 : 1 }}>
      <button onClick={() => setOpen((o) => !o)} className="account-pill">
        <div className="account-avatar">
          {ACCOUNT_MANAGER.photo ? (
            <img src={ACCOUNT_MANAGER.photo} alt={ACCOUNT_MANAGER.name} />
          ) : (
            ACCOUNT_MANAGER.initials
          )}
        </div>
        <div style={{ textAlign: "left" }}>
          <div className="account-pill-name">{ACCOUNT_MANAGER.name}</div>
          <div className="account-pill-role">{ACCOUNT_MANAGER.role}</div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="account-card"
          >
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
              <div className="account-avatar large">
                {ACCOUNT_MANAGER.photo ? (
                  <img src={ACCOUNT_MANAGER.photo} alt={ACCOUNT_MANAGER.name} />
                ) : (
                  ACCOUNT_MANAGER.initials
                )}
              </div>
              <div>
                <div className="fh" style={{
                  fontSize: 17, fontWeight: 900, letterSpacing: "-0.025em", color: "var(--d)",
                }}>{ACCOUNT_MANAGER.name}</div>
                <div className="fb" style={{
                  fontSize: 12, color: "var(--o)", fontStyle: "italic", fontWeight: 600,
                }}>{ACCOUNT_MANAGER.role}</div>
              </div>
            </div>

            <p className="fb" style={{
              fontSize: 13.5, color: "var(--d-soft)",
              lineHeight: 1.55, marginBottom: 14,
              paddingBottom: 14, borderBottom: "1px dashed var(--line)",
            }}>
              I'm your direct line. Anything you need, drop me a message — I usually reply within a couple of hours.
            </p>

            <a href={`mailto:${ACCOUNT_MANAGER.email}`} className="account-card-btn primary">
              Email George
            </a>
            <button className="account-card-btn">Book a 15-min chat</button>
            <button className="account-card-btn subtle">WhatsApp message</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   DASHBOARD SECTIONS (unchanged from v2)
   ───────────────────────────────────────────────────────────────────────── */

function DashHome({ industry, place, setSection }) {
  const drafts = DRAFTS_BY_INDUSTRY[industry] || DRAFTS_BY_INDUSTRY.service;
  const tasks = TASKS_BY_INDUSTRY[industry] || TASKS_BY_INDUSTRY.service;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 28, flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <h1 className="fh" style={{
            fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em",
            color: "var(--d)", marginBottom: 6,
          }}>Morning. Here's where things stand.</h1>
          <p className="fb" style={{ fontSize: 14, color: "var(--d-soft)" }}>
            Week 3 of your strategy · 8 posts published · trending up
          </p>
        </div>
        <button className="primary-btn-sm" onClick={() => setSection("drafts")}>
          Review this week's drafts
        </button>
      </div>

      <div className="stat-grid">
        <StatCard label="Reach" value="2,847" delta="+18%" deltaPositive
          tooltip="People who saw your content this week, across all channels."
          why="Reach tells you how many actual humans saw your stuff. Good first signal that your content is landing." />
        <StatCard label="Profile views" value="143" delta="+24%" deltaPositive
          tooltip="People who clicked through to your business profile."
          why="Profile views are warm leads — someone interested enough to check you out properly." />
        <StatCard label="Enquiries" value="12" delta="+5" deltaPositive
          tooltip="Direct messages, booking requests, or contact form submissions."
          why="The number that actually pays the bills. Everything else is upstream of this." />
        <StatCard label="Reviews" value="4.9" delta="2 new" deltaPositive
          tooltip="Average Google review rating, all-time."
          why="Reviews are the strongest local-search signal. New ones every month keep you visible." />
      </div>

      <div className="dash-2col" style={{ marginTop: 24 }}>
        <div className="app-card">
          <div className="app-card-head">
            <h3>This week's plan</h3>
            <button className="app-card-link" onClick={() => setSection("tasks")}>See all →</button>
          </div>
          {tasks.slice(0, 3).map((t, i) => (
            <div key={i} className={`task-row ${t.done ? "done" : ""}`}>
              <div className={`task-check ${t.done ? "done" : ""}`} />
              <div style={{ flex: 1 }}>
                <div className="task-title">{t.title}</div>
                <div className="task-meta">{t.meta}</div>
              </div>
              <span className="task-day">{t.day || "Tue"}</span>
            </div>
          ))}
        </div>

        <div className="app-card">
          <div className="app-card-head">
            <h3>Mate's draft, ready to ship</h3>
            <button className="app-card-link" onClick={() => setSection("drafts")}>All drafts →</button>
          </div>
          <div className="draft-meta-row">
            <span className="draft-channel">{drafts[0]?.channel || "Instagram · Reel"}</span>
            <span className="draft-status">Awaiting your approval</span>
          </div>
          <p className="draft-body">{(drafts[0]?.text || "").replace("{LOCATION}", place)}</p>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="primary-btn-sm">Approve & schedule</button>
            <button className="ghost-btn-sm">Tweak</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DashCalendar({ industry, place }) {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const contentDays = {
    3: { type: "post", channel: "Instagram", title: "Behind-the-scenes" },
    7: { type: "reel", channel: "Instagram", title: "Transformation" },
    10: { type: "gbp", channel: "Google", title: "Weekly update" },
    14: { type: "post", channel: "Facebook", title: "Customer story" },
    17: { type: "reel", channel: "Instagram", title: "Process video" },
    21: { type: "email", channel: "Email", title: "Monthly newsletter" },
    24: { type: "gbp", channel: "Google", title: "Photos" },
    28: { type: "post", channel: "Instagram", title: "Authority post" },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="fh" style={{
          fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em", color: "var(--d)", marginBottom: 6,
        }}>Content calendar</h1>
        <p className="fb" style={{ fontSize: 14, color: "var(--d-soft)" }}>
          {today.toLocaleString("default", { month: "long", year: "numeric" })} · 8 pieces planned · 3 ready to ship
        </p>
      </div>

      <div className="app-card">
        <div className="cal-grid-large" style={{ marginBottom: 8 }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="cal-head-large">{d}</div>
          ))}
        </div>
        <div className="cal-grid-large">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`pad-${i}`} className="cal-cell empty" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const content = contentDays[dayNum];
            const isToday = dayNum === today.getDate();
            return (
              <div key={dayNum} className={`cal-cell ${content ? "has" : ""} ${isToday ? "today" : ""}`}>
                <span className="cal-num">{dayNum}</span>
                {content && (
                  <div className="cal-pill">
                    <span className="cal-pill-channel">{content.channel}</span>
                    <span className="cal-pill-title">{content.title}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function DashDrafts({ industry, place }) {
  const drafts = DRAFTS_BY_INDUSTRY[industry] || DRAFTS_BY_INDUSTRY.service;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="fh" style={{
          fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em", color: "var(--d)", marginBottom: 6,
        }}>Drafts</h1>
        <p className="fb" style={{ fontSize: 14, color: "var(--d-soft)" }}>
          {drafts.length} pieces ready for your review · approve, tweak, or rewrite
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {drafts.map((d, i) => (
          <div key={i} className="app-card draft-card">
            <div className="draft-meta-row">
              <span className="draft-channel">{d.channel}</span>
              <span className="draft-status">{i === 0 ? "Awaiting approval" : i === 1 ? "Drafted today" : "In review"}</span>
            </div>
            <p className="draft-body">{d.text.replace("{LOCATION}", place)}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
              <button className="primary-btn-sm">Approve & schedule</button>
              <button className="ghost-btn-sm">Tweak</button>
              <button className="ghost-btn-sm">Rewrite</button>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--d-soft)", fontStyle: "italic" }}>
                {d.scheduledFor || "Unscheduled"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DashTasks({ industry }) {
  const tasks = TASKS_BY_INDUSTRY[industry] || TASKS_BY_INDUSTRY.service;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="fh" style={{
          fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em", color: "var(--d)", marginBottom: 6,
        }}>Tasks this week</h1>
        <p className="fb" style={{ fontSize: 14, color: "var(--d-soft)" }}>
          {tasks.filter((t) => !t.done).length} to do · {tasks.filter((t) => t.done).length} done
        </p>
      </div>
      <div className="app-card">
        {tasks.map((t, i) => (
          <div key={i} className={`task-row ${t.done ? "done" : ""}`}>
            <div className={`task-check ${t.done ? "done" : ""}`} />
            <div style={{ flex: 1 }}>
              <div className="task-title">{t.title}</div>
              <div className="task-meta">{t.meta}</div>
            </div>
            <span className="task-day">{t.day || "—"}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DashAnalytics() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="fh" style={{
          fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em", color: "var(--d)", marginBottom: 6,
        }}>Analytics</h1>
        <p className="fb" style={{ fontSize: 14, color: "var(--d-soft)" }}>
          Last 30 days · hover the <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 14, height: 14, borderRadius: "50%",
            background: "var(--o-soft)", color: "var(--o)",
            fontSize: 9, fontWeight: 700, margin: "0 3px",
          }}>?</span> on anything to learn what it means
        </p>
      </div>

      <div className="stat-grid">
        <StatCard label="Impressions" value="14,230" delta="+12%" deltaPositive
          tooltip="Times your content was shown to someone, anywhere."
          why="A volume number — useful as a baseline. On its own it doesn't pay your bills, but if it's not growing, nothing else will." />
        <StatCard label="Reach" value="9,840" delta="+18%" deltaPositive
          tooltip="Unique people who saw your content (de-duplicated)."
          why="Reach tells you how many real humans saw your stuff. Better signal than impressions." />
        <StatCard label="Engagement rate" value="6.2%" delta="+1.8pp" deltaPositive
          tooltip="Likes, comments, shares, and saves as a percentage of reach."
          why="Industry average is ~2%. Above 5% means content is genuinely landing — keep doing more of what's working." />
        <StatCard label="Profile visits" value="487" delta="+24%" deltaPositive
          tooltip="People who clicked through to view your full business profile."
          why="The first warm signal of intent. Someone interested enough to look you up properly." />
        <StatCard label="Enquiries" value="38" delta="+11" deltaPositive
          tooltip="Direct messages, booking requests, and contact form submissions."
          why="The number that pays your bills. Everything else is upstream of this." />
        <StatCard label="Conversion rate" value="7.8%" delta="+2.1pp" deltaPositive
          tooltip="Enquiries divided by profile visits."
          why="Tells you how compelling your profile is at turning interest into action. Above 5% is healthy for most service businesses." />
      </div>

      <div className="app-card" style={{ marginTop: 20 }}>
        <div className="app-card-head">
          <h3>Trend · last 12 weeks</h3>
          <span style={{ fontSize: 12, color: "var(--d-soft)", fontStyle: "italic" }}>Reach, weekly</span>
        </div>
        <Sparkline />
      </div>

      <div className="dash-2col" style={{ marginTop: 20 }}>
        <div className="app-card">
          <h3 className="app-card-h">What's working</h3>
          <ul className="bullet-list">
            <li>Reels are outperforming static posts 3:1 on reach</li>
            <li>Tuesday and Friday posts get the strongest engagement</li>
            <li>Posts with photos of you/your team beat product shots</li>
          </ul>
        </div>
        <div className="app-card">
          <h3 className="app-card-h">Where to focus next</h3>
          <ul className="bullet-list orange">
            <li>Double down on Reels — try one extra per week</li>
            <li>Move long-form posts to Tuesday or Friday</li>
            <li>Add review request follow-up (currently 0% sent)</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

function DashSettings() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="fh" style={{
          fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em", color: "var(--d)", marginBottom: 6,
        }}>Settings</h1>
        <p className="fb" style={{ fontSize: 14, color: "var(--d-soft)" }}>Brand voice, channels, and account</p>
      </div>
      <div className="dash-2col">
        <div className="app-card">
          <h3 className="app-card-h">Brand voice</h3>
          <div className="settings-row"><span className="settings-label">Tone</span><span className="settings-value">Warm, direct, no jargon</span></div>
          <div className="settings-row"><span className="settings-label">Avoid</span><span className="settings-value">"Synergy", emojis, exclamation marks</span></div>
          <div className="settings-row"><span className="settings-label">Sign-off</span><span className="settings-value">"See you soon"</span></div>
          <button className="ghost-btn-sm" style={{ marginTop: 14 }}>Edit voice</button>
        </div>
        <div className="app-card">
          <h3 className="app-card-h">Connected channels</h3>
          {[
            { name: "Instagram", status: "Connected", color: true },
            { name: "Facebook", status: "Connected", color: true },
            { name: "Google Business Profile", status: "Connected", color: true },
            { name: "TikTok", status: "Not connected", color: false },
            { name: "LinkedIn", status: "Not connected", color: false },
            { name: "Email (Mailchimp)", status: "Connected", color: true },
          ].map((c) => (
            <div key={c.name} className="settings-row">
              <span className="settings-label">{c.name}</span>
              <span className="settings-value" style={{
                color: c.color ? "var(--o)" : "var(--d-soft)",
                fontStyle: c.color ? "normal" : "italic",
              }}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   StatCard — tooltip layered above sibling cards (z-index fix)
   ───────────────────────────────────────────────────────────────────────── */

function StatCard({ label, value, delta, deltaPositive, tooltip, why }) {
  const [showWhy, setShowWhy] = useState(false);

  return (
    <div
      className="stat-card"
      style={{ zIndex: showWhy ? 50 : 1 }}
      onMouseLeave={() => setShowWhy(false)}
    >
      <div className="stat-label-row">
        <span className="stat-label-name">{label}</span>
        <button
          className="info-btn"
          onMouseEnter={() => setShowWhy(true)}
          onMouseLeave={() => setShowWhy(false)}
          aria-label={`What is ${label}?`}
        >?</button>
      </div>
      <div className="stat-value">{value}</div>
      <div className={`stat-delta ${deltaPositive ? "up" : "down"}`}>
        {deltaPositive ? "↑" : "↓"} {delta} vs last period
      </div>

      <AnimatePresence>
        {showWhy && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.16 }}
            className="info-tooltip"
          >
            <div className="info-tooltip-title">{label}</div>
            <div className="info-tooltip-body">{tooltip}</div>
            {why && (
              <>
                <div className="info-tooltip-divider" />
                <div className="info-tooltip-why-label">Why it matters</div>
                <div className="info-tooltip-body">{why}</div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Sparkline
   ───────────────────────────────────────────────────────────────────────── */

function Sparkline() {
  const data = [120, 180, 220, 240, 280, 320, 380, 420, 510, 580, 670, 740];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 700;
  const height = 140;
  const padding = 20;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * innerW;
    const y = padding + (1 - (v - min) / range) * innerH;
    return [x, y];
  });

  const pathLine = points.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");
  const pathArea = `${pathLine} L ${points[points.length - 1][0]} ${height - padding} L ${points[0][0]} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={pathArea} fill="url(#sparkfill)" />
      <path d={pathLine} fill="none" stroke="#ff6b35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === points.length - 1 ? 4 : 2.5} fill="#ff6b35" />
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Presenter panel
   ───────────────────────────────────────────────────────────────────────── */

function PresenterPanel({ open, portal, onClose, onJumpTo, onSkip }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.96 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="panel"
        >
          <h4>Presenter</h4>
          <div className="panel-row"><span>Toggle panel</span><span className="key">⌘ /</span></div>
          <div className="panel-row"><span>Skip ahead</span><span className="key">⌘ →</span></div>
          <div className="panel-row"><span>Reset demo</span><span className="key">⌘ R</span></div>

          <div className="panel-divider" />

          <h4>Jump to portal</h4>
          {[
            { id: "boot", label: "Boot screen" },
            { id: "chat", label: "Chat" },
            { id: "loading-strategy", label: "Loading · strategy" },
            { id: "strategy", label: "Strategy" },
            { id: "loading-dashboard", label: "Loading · dashboard" },
            { id: "dashboard", label: "Dashboard" },
          ].map((p) => (
            <button
              key={p.id}
              className={`panel-jump-btn ${portal === p.id ? "current" : ""}`}
              onClick={() => onJumpTo(p.id)}
            >
              {p.label}
              {portal === p.id && <span style={{ opacity: 0.6, fontSize: 11 }}>· now</span>}
            </button>
          ))}

          <div className="panel-divider" />

          <button className="panel-btn primary" onClick={() => {
            try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
            window.location.reload();
          }}>
            ↺ Reset demo
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   DRAFTS by industry — expanded
   ───────────────────────────────────────────────────────────────────────── */

const DRAFTS_BY_INDUSTRY = {
  trade: [
    { channel: "Instagram · Reel", text: "Had a brilliant one today — emergency callout in {LOCATION}, leak in the kitchen ceiling at half nine on a Sunday night. Half an hour later, sorted. This is what we're here for.\n\nIf you've ever wondered who to call when something goes properly wrong — save our number. We'll pick up.", scheduledFor: "Tomorrow, 8:00 AM" },
    { channel: "Google Business Profile", text: "This week we're reminding everyone in {LOCATION} that the cold snap is the #1 cause of burst pipes. If you've got an outside tap that hasn't been lagged, today's the day. Thirty minutes of work saves you a £900 callout.", scheduledFor: "Wed, 9:30 AM" },
    { channel: "Facebook · Post", text: "Honest moment — most boiler problems we see could've been spotted six months earlier with a £75 service. We're not saying that to sell you one. We're saying it because we've seen too many people facing a £2,000 replacement on the coldest week of the year.", scheduledFor: "Unscheduled" },
  ],
  beauty: [
    { channel: "Instagram · Reel", text: "Friday client transformation — balayage and a fresh cut, taking her from \"I need a change\" to \"I love this.\"\n\nBooking up fast for next week — drop us a message if you want in.", scheduledFor: "Tomorrow, 6:00 PM" },
    { channel: "Instagram · Story Series", text: "Behind the scenes of today's full transformation. Six hours, three colour formulas, and a client who came in crying and left dancing. This is genuinely the best part of the job.", scheduledFor: "Today, throughout" },
    { channel: "Email", text: "Hi {first_name},\n\nIt's been a few weeks since your last visit — we've got our calendar opening up again and wanted to give you first dibs before next month's slots go.\n\nReply with a preferred day and we'll get you booked in. Looking forward to it.", scheduledFor: "Unscheduled" },
  ],
  restaurant: [
    { channel: "Instagram · Post", text: "Tonight's special — slow-roasted lamb shoulder, sticky red onions, mash that's mostly butter. Walk-ins welcome from 6, or book the table — link in bio.\n\nSee you here.", scheduledFor: "Today, 5:00 PM" },
    { channel: "Google Business Profile", text: "We're open every day this week including Sunday. Our new tasting menu launches Friday — five courses, paired wines, £55 a head. Booking now, going fast as always.", scheduledFor: "Wed, 9:00 AM" },
    { channel: "Email", text: "Hello,\n\nQuick one to say we've got something special on next Friday — a tasting menu evening with the wines we serve, a fire going, and our chef showing off a bit. £55 per person. Reply to grab a seat — we're keeping it small.", scheduledFor: "Unscheduled" },
  ],
  cafe: [
    { channel: "Instagram · Reel", text: "Morning regulars know — Tuesday is fresh croissant day. Watching them come out of the oven at 6am genuinely never gets old.\n\nIf you haven't been in for a bit, we've also got the autumn menu running now. Pop in, the coffee's on.", scheduledFor: "Tomorrow, 7:30 AM" },
    { channel: "Google Business Profile", text: "Now serving a proper full breakfast — eggs from a farm we trust, bread from {LOCATION}'s best baker, coffee that takes its time. Saturdays from 8.", scheduledFor: "Thu, 9:00 AM" },
    { channel: "Email", text: "Quick one this month — new beans landed (a really lovely Colombian we're properly excited about), the autumn menu's up, and we've got a small evening event next month — coffee tasting, a few snacks, low-key. Reply if you want a spot.", scheduledFor: "Unscheduled" },
  ],
  hospo: [
    { channel: "Instagram · Post", text: "This week's special — link in bio for the full menu. Walk-ins welcome from 6, or book ahead.", scheduledFor: "Mon, 11:00 AM" },
    { channel: "Google Business Profile", text: "Open every day this week. Booking up well for the weekend.", scheduledFor: "Wed, 9:00 AM" },
    { channel: "Email", text: "Quick monthly note — what's on this month, plus a small reminder about our loyalty programme.", scheduledFor: "Unscheduled" },
  ],
  wellness: [
    { channel: "Instagram · Reel", text: "One-minute tip — your hip flexors are probably tighter than you think. Three minutes of this hold every morning will change your posture, your back pain, and how you feel sitting at a desk. Try it tomorrow.", scheduledFor: "Tomorrow, 7:00 AM" },
    { channel: "Email", text: "Hi {first_name},\n\nOne thing on my mind this month — most of my clients come in with neck and shoulder tension that's been there for years. We tend to think of it as inevitable. It isn't. Reply if you want a 15-minute chat about whether what we do could help.", scheduledFor: "Fri, 8:00 AM" },
    { channel: "Google Business Profile", text: "Booking opens for July sessions next Monday at 9am. Same as always — block-of-six is best value, single sessions available too. Drop a message if you want in.", scheduledFor: "Unscheduled" },
  ],
  creative: [
    { channel: "Instagram · Reel", text: "Behind the scenes on this week's shoot — 4am call time, three locations, one very patient client. Final pieces dropping next month.\n\nBooking new projects for the autumn — drop a line if you're planning something.", scheduledFor: "Tomorrow, 5:00 PM" },
    { channel: "LinkedIn · Post", text: "The brief said \"clean and modern.\" The brand was 80 years old with a story to tell. Here's what we did instead, and why the client thanked us for ignoring the brief — link in comments.", scheduledFor: "Thu, 9:00 AM" },
    { channel: "Email · Cold outreach", text: "Hi [name],\n\nI saw your latest [project / launch / refresh] and wanted to drop a line. We work with [industry / size] businesses on [specific thing]. No sales pitch — just thought it was worth being on each other's radars. Worth 15 minutes?\n\nGeorge", scheduledFor: "Unscheduled" },
  ],
  travel: [
    { channel: "Instagram · Carousel", text: "Just back from putting together this couple's 10-day Italy honeymoon. They wanted: Amalfi without the crowds, a private cooking class, and one really memorable dinner. Here's what we did and why each piece was chosen — swipe through.\n\nIf you're planning a trip and want to talk through what's actually possible, my diary's open.", scheduledFor: "Tomorrow, 5:00 PM" },
    { channel: "Email · Newsletter", text: "Hello,\n\nMonthly note — three trips I've been working on this month, one thing I've learned about Greece this year, and a quiet recommendation for shoulder-season Japan if you're thinking ahead.\n\nReply if anything sparks something.", scheduledFor: "Fri, 9:00 AM" },
    { channel: "LinkedIn · Post", text: "After 8 years arranging trips, the single biggest mistake I see is people booking the destination before the experience. Here's how I help clients flip that — and why it changes everything about a holiday.", scheduledFor: "Unscheduled" },
  ],
  estate: [
    { channel: "Instagram · Reel", text: "Quick walkaround of the new listing on Acacia Road. Three beds, garden you can actually do something with, and a kitchen that's ready to move into. Open viewings Saturday — link in bio.", scheduledFor: "Tomorrow, 4:00 PM" },
    { channel: "Email · Local Market Update", text: "Hello,\n\nThis month in {LOCATION}: 14 sales agreed, average time to offer down to 18 days, three new instructions on the road we sold on last month. If you're curious what your home might be worth right now, reply and I'll pull a proper figure together.", scheduledFor: "Wed, 9:00 AM" },
    { channel: "Google Business Profile", text: "New listings going live this week — Acacia Road (3 bed, £495k) and Mill Lane (2 bed flat, £325k). Viewings booking now. Drop us a message for the brochures.", scheduledFor: "Unscheduled" },
  ],
  petcare: [
    { channel: "Instagram · Reel", text: "Today's pack — six dogs, two hours, one very tired walker (not me, them). This is honestly the best job in the world.\n\nTaking on a couple more regulars from next month — DM if you're looking.", scheduledFor: "Tomorrow, 6:00 PM" },
    { channel: "Google Business Profile", text: "Slots opening up for new clients in {LOCATION} from next month. Insured, DBS-checked, references from current clients available. Drop a message — happy to come and meet your dog first.", scheduledFor: "Wed, 9:00 AM" },
    { channel: "Instagram · Story", text: "Quick training tip — the 'wait' command at doorways will change your daily walks more than anything else. Three things to make it stick: short sessions, real reward, and consistency from everyone in the house.", scheduledFor: "Unscheduled" },
  ],
  retail: [
    { channel: "Instagram · Reel", text: "New in this week — and it's beautiful. Hand-thrown ceramics from a maker in Cornwall, the autumn knitwear is finally here, and we've snuck in a few candles that genuinely smell like the season.\n\nPop in for a wander — kettle's always on.", scheduledFor: "Tomorrow, 11:00 AM" },
    { channel: "Email · Newsletter", text: "Hello,\n\nA short note this month — what's new in, an event we're hosting in October, and a small thank you offer for being on this list. Hope to see you in {LOCATION} soon.", scheduledFor: "Fri, 10:00 AM" },
    { channel: "Google Business Profile", text: "Late-night opening this Thursday — open till 8pm with mince pies, mulled wine, and 10% off everything in store. Bring a friend.", scheduledFor: "Unscheduled" },
  ],
  legal: [
    { channel: "LinkedIn · Post", text: "The single most common question I'm asked at first meetings: \"Should I do this myself or get a solicitor?\" My honest answer is in the post — and it's probably not what you'd expect from a lawyer.", scheduledFor: "Tomorrow, 9:00 AM" },
    { channel: "Email · Referrer Update", text: "Hi [name],\n\nQuick quarterly note — three things I've been seeing in {LOCATION} this quarter that might be relevant for your clients, plus an open invitation for a coffee in the next month. Always good to compare notes.", scheduledFor: "Wed, 10:00 AM" },
    { channel: "Google Business Profile", text: "Free 20-minute initial consultation for all new clients this autumn. Drop us an email or call — we'll talk you through what's involved before you commit to anything.", scheduledFor: "Unscheduled" },
  ],
  cars: [
    { channel: "Instagram · Reel", text: "Just landed — 2021 BMW 1 Series, M Sport, 18k miles, full service history with us. Listed below the market because we'd rather it goes to a good home this week than sit on the forecourt. DM for details.", scheduledFor: "Tomorrow, 5:00 PM" },
    { channel: "Google Business Profile", text: "This week's stock — fully prepped, fully transparent. Photos, video walkarounds, and honest condition reports on every single one. No surprises, no pressure. Have a look in the gallery.", scheduledFor: "Wed, 10:00 AM" },
    { channel: "Email · Follow-up", text: "Hi [name],\n\nQuick one — you looked at the [model] with us a few weeks ago and we know it didn't work out at the time. Couple of things have come in this week that might be a better fit. Worth a 5-minute look?", scheduledFor: "Unscheduled" },
  ],
  service: [
    { channel: "Instagram · Post", text: "Quick one — Mondays we send out weekly availability and a quick tip from the week. If you'd like that landing in your inbox, the signup's pinned to our profile.\n\nNo spam, just useful stuff.", scheduledFor: "Tomorrow, 9:00 AM" },
    { channel: "Google Business Profile", text: "Booking up well for next week. If you're looking for [service] in {LOCATION}, drop us a message and we'll talk you through availability.", scheduledFor: "Wed, 8:00 AM" },
    { channel: "Email", text: "Hi {first_name},\n\nMonthly check-in. Three things — we've got a few new slots opening up next month, here's a quick tip we've been sharing with clients, and as ever, hit reply if you've got anything you'd like a hand with.", scheduledFor: "Unscheduled" },
  ],
};

const TASKS_BY_INDUSTRY = {
  trade: [
    { title: "Post 3 photos to Google Business Profile", meta: "Mate's drafted captions ready", done: false, day: "Mon" },
    { title: "Send review request to last 5 customers", meta: "Templates ready — one tap", done: true, day: "Mon" },
    { title: "Instagram reel: emergency callout BTS", meta: "Mate's drafted script + caption", done: false, day: "Tue" },
    { title: "Update website with new postcode coverage", meta: "Boilerplate ready in your inbox", done: false, day: "Thu" },
    { title: "Reply to 2 unanswered enquiries", meta: "Last contact: 4 days ago", done: false, day: "Today" },
  ],
  beauty: [
    { title: "Post transformation reel — Tuesday", meta: "Mate's drafted caption + hashtags", done: false, day: "Tue" },
    { title: "Send rebooking nudge to 6-week clients", meta: "12 clients due — templates ready", done: true, day: "Mon" },
    { title: "Update Google Business Profile photos", meta: "Mate's selected 8 from your camera roll", done: false, day: "Wed" },
    { title: "Email: 'we miss you' to lapsed clients", meta: "Mate's drafted full email", done: false, day: "Fri" },
    { title: "Reply to 4 new DMs", meta: "Booking enquiries — under 2 hours each", done: false, day: "Today" },
  ],
  restaurant: [
    { title: "Post tonight's special on Instagram", meta: "Photo + caption ready", done: false, day: "Today" },
    { title: "Reply to 4 new Google reviews", meta: "Drafted personalised replies", done: true, day: "Mon" },
    { title: "Friday tasting menu email", meta: "Drafted, awaiting approval", done: false, day: "Wed" },
    { title: "Schedule weekend Instagram stories", meta: "6 highlights selected", done: false, day: "Fri" },
    { title: "Update GBP with weekend menu", meta: "Photos + copy ready", done: false, day: "Today" },
  ],
  cafe: [
    { title: "Post 'fresh croissant' reel", meta: "Filmed already, caption drafted", done: false, day: "Tue" },
    { title: "Reply to 3 new Google reviews", meta: "Drafted replies ready", done: true, day: "Mon" },
    { title: "Update QR menu with autumn drinks", meta: "Mate's drafted descriptions", done: false, day: "Wed" },
    { title: "Send monthly email", meta: "Drafted, awaiting your eye", done: false, day: "Fri" },
    { title: "Photograph 5 new dishes", meta: "Phone reminder set for 11am", done: false, day: "Today" },
  ],
  hospo: [
    { title: "Post weekly menu special", meta: "Caption ready", done: false, day: "Mon" },
    { title: "Reply to new Google reviews", meta: "Drafted replies", done: true, day: "Mon" },
    { title: "Friday email newsletter", meta: "Drafted full email", done: false, day: "Fri" },
    { title: "Update GBP photos", meta: "8 selected", done: false, day: "Thu" },
    { title: "Schedule weekend stories", meta: "Highlights selected", done: false, day: "Today" },
  ],
  wellness: [
    { title: "Film 'one-minute tip' video", meta: "3 topic options drafted", done: false, day: "Wed" },
    { title: "Send monthly email", meta: "Drafted full email", done: true, day: "Mon" },
    { title: "GBP weekly post", meta: "Drafted weekly content", done: false, day: "Tue" },
    { title: "Reply to 2 new enquiries", meta: "Both interested in 6-session blocks", done: false, day: "Today" },
    { title: "Schedule next month's content", meta: "8 pieces drafted", done: false, day: "Fri" },
  ],
  creative: [
    { title: "Post BTS reel of latest project", meta: "Caption drafted", done: false, day: "Tue" },
    { title: "Send 5 outreach emails", meta: "Personalised pitches drafted", done: true, day: "Mon" },
    { title: "LinkedIn process post", meta: "Drafted + image suggested", done: false, day: "Thu" },
    { title: "Update portfolio with 3 pieces", meta: "Cover images ready", done: false, day: "Fri" },
    { title: "Follow up with 2 warm leads", meta: "Both replied positively", done: false, day: "Today" },
  ],
  travel: [
    { title: "Post Italy honeymoon carousel", meta: "10 slides drafted, photos ready", done: false, day: "Tue" },
    { title: "Send monthly newsletter", meta: "Drafted, awaiting approval", done: true, day: "Mon" },
    { title: "Send referral requests", meta: "Last 3 clients — drafted", done: false, day: "Wed" },
    { title: "Reply to 4 trip enquiries", meta: "All received this week", done: false, day: "Today" },
    { title: "Plan next month's content batch", meta: "Niche: Italy + Greece", done: false, day: "Fri" },
  ],
  estate: [
    { title: "Film walkaround for new listing", meta: "Reel script drafted", done: false, day: "Tue" },
    { title: "Send local market email", meta: "Drafted with this month's stats", done: true, day: "Mon" },
    { title: "Request reviews from last 5 completions", meta: "Templates ready", done: false, day: "Wed" },
    { title: "Update website listings", meta: "3 new, 2 sold", done: false, day: "Thu" },
    { title: "Follow up with 4 viewing leads", meta: "All from weekend's open house", done: false, day: "Today" },
  ],
  petcare: [
    { title: "Post pack walk reel", meta: "Footage from today, caption drafted", done: false, day: "Tue" },
    { title: "Request reviews from regulars", meta: "5 clients identified", done: true, day: "Mon" },
    { title: "Training tip story series", meta: "3 stories drafted", done: false, day: "Wed" },
    { title: "GBP photo update", meta: "10 great shots selected", done: false, day: "Fri" },
    { title: "Reply to 2 new client enquiries", meta: "Both want a meet & greet", done: false, day: "Today" },
  ],
  retail: [
    { title: "Post 'new in' reel", meta: "Filmed, caption drafted", done: false, day: "Tue" },
    { title: "Email monthly newsletter", meta: "Drafted, awaiting your eye", done: true, day: "Mon" },
    { title: "Update GBP with autumn photos", meta: "12 selected", done: false, day: "Wed" },
    { title: "Plan late-night opening event", meta: "Date set, promo drafted", done: false, day: "Thu" },
    { title: "Reply to 3 DM enquiries", meta: "All product questions", done: false, day: "Today" },
  ],
  legal: [
    { title: "LinkedIn 'common question' post", meta: "Drafted, awaiting approval", done: false, day: "Tue" },
    { title: "Send referrer quarterly email", meta: "5 contacts, drafted", done: true, day: "Mon" },
    { title: "Audit top 3 practice-area pages", meta: "Notes drafted", done: false, day: "Thu" },
    { title: "Request reviews from last 5 clients", meta: "Templates ready", done: false, day: "Fri" },
    { title: "Reply to 2 new enquiries", meta: "Both via website form", done: false, day: "Today" },
  ],
  cars: [
    { title: "Post new arrival reel", meta: "BMW 1 Series — caption drafted", done: false, day: "Tue" },
    { title: "Send 'still looking?' follow-ups", meta: "8 leads from last 4 weeks", done: true, day: "Mon" },
    { title: "Improve photos on 5 listings", meta: "Lighting checked", done: false, day: "Wed" },
    { title: "Request reviews from 4 sold customers", meta: "Templates ready", done: false, day: "Fri" },
    { title: "Reply to 3 AutoTrader enquiries", meta: "All this morning", done: false, day: "Today" },
  ],
  service: [
    { title: "Post weekly Google Business update", meta: "Caption ready", done: false, day: "Mon" },
    { title: "Send review request to last 5 customers", meta: "Templates ready", done: true, day: "Mon" },
    { title: "Instagram post — Thursday", meta: "Caption + image ready", done: false, day: "Thu" },
    { title: "Email past 10 customers", meta: "Drafted full email", done: false, day: "Fri" },
    { title: "Reply to 2 unanswered enquiries", meta: "Last contact: 3 days ago", done: false, day: "Today" },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────
   GLOBAL STYLES
   ───────────────────────────────────────────────────────────────────────── */

function GlobalStyles() {
  return (
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
        --app-bg: #f4ede1;
        --app-surface: #ffffff;
        --app-sidebar: #2a2725;
        --fh: 'Aileron', 'Helvetica Neue', Arial, sans-serif;
        --fb: 'Raleway', sans-serif;
      }
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { height: 100%; }
      body {
        background: var(--bg);
        color: var(--d);
        font-family: var(--fb);
        -webkit-font-smoothing: antialiased;
        overflow: hidden;
      }
      .fh { font-family: var(--fh); }
      .fb { font-family: var(--fb); }
      input, textarea, button { font-family: var(--fb); outline: none; }
      ::selection { background: var(--o); color: white; }

      .grain {
        position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.035;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        background-size: 160px;
      }

      .eyebrow {
        font-size: 14px; font-weight: 600;
        color: var(--o); font-style: italic;
        display: inline-flex; align-items: center; gap: 10px;
      }
      .eyebrow::before {
        content: ''; width: 22px; height: 2px;
        background: var(--o); border-radius: 2px;
      }

      .portal-shell {
        position: fixed; inset: 0; z-index: 5;
        display: flex; flex-direction: column;
      }

      .presenter-btn {
        position: fixed; top: 18px; right: 18px;
        width: 36px; height: 36px;
        border-radius: 12px;
        background: rgba(42,39,37,0.92);
        color: white; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        z-index: 200;
        box-shadow: 0 4px 16px rgba(0,0,0,0.16);
        transition: opacity 0.2s;
        opacity: 0.8;
      }
      .presenter-btn:hover { opacity: 1; }

      /* Loader orbit */
      .orbit-wrap {
        position: relative;
        width: 96px; height: 96px;
      }
      .orbit-core {
        position: absolute; top: 50%; left: 50%;
        width: 16px; height: 16px;
        border-radius: 50%;
        background: var(--o);
        transform: translate(-50%, -50%);
        box-shadow: 0 0 0 6px rgba(255,107,53,0.16),
                    0 0 24px rgba(255,107,53,0.4);
        animation: orbit-pulse 1.4s ease-in-out infinite;
      }
      @keyframes orbit-pulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.85; }
      }
      .orbit-ring {
        position: absolute;
        border-radius: 50%;
        border: 1.5px solid var(--line);
        border-top-color: var(--o);
        animation: orbit-spin linear infinite;
      }
      .orbit-ring-1 {
        inset: 16px; animation-duration: 2s;
      }
      .orbit-ring-2 {
        inset: 4px; animation-duration: 3s; animation-direction: reverse;
        opacity: 0.6;
      }
      .orbit-ring-3 {
        inset: -8px; animation-duration: 5s;
        opacity: 0.35;
      }
      @keyframes orbit-spin {
        to { transform: rotate(360deg); }
      }

      .scroll-col {
        flex: 1; overflow-y: auto;
        scroll-behavior: smooth;
        padding: 32px 0 240px;
      }
      .stream {
        max-width: 720px; margin: 0 auto; padding: 0 24px;
      }

      .msg { display: flex; margin-bottom: 14px; }
      .msg-mate { justify-content: flex-start; }
      .msg-user { justify-content: flex-end; }

      .msg-bubble {
        max-width: 85%; padding: 14px 18px;
        border-radius: 18px; font-size: 16px;
        line-height: 1.55; word-wrap: break-word;
      }
      .msg-bubble-mate {
        background: white; color: var(--d);
        border: 1px solid var(--line);
        border-top-left-radius: 6px;
        box-shadow: 0 2px 8px -4px rgba(42,39,37,0.06);
      }
      .msg-bubble-user {
        background: var(--o); color: white;
        border-top-right-radius: 6px; font-weight: 500;
      }

      .cursor {
        display: inline-block;
        width: 7px; height: 1em;
        background: var(--o);
        margin-left: 2px;
        vertical-align: text-bottom;
        animation: blink 1s step-end infinite;
      }
      @keyframes blink { 50% { opacity: 0; } }

      .typing {
        display: inline-flex; gap: 4px;
        padding: 14px 18px;
        background: white;
        border: 1px solid var(--line);
        border-radius: 18px;
        border-top-left-radius: 6px;
      }
      .typing span {
        width: 7px; height: 7px; border-radius: 50%;
        background: var(--d-soft); opacity: 0.45;
        animation: typing 1.3s infinite ease-in-out;
      }
      .typing span:nth-child(2) { animation-delay: 0.18s; }
      .typing span:nth-child(3) { animation-delay: 0.36s; }
      @keyframes typing {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-4px); opacity: 1; }
      }

      .input-bar-wrap {
        position: absolute;
        bottom: 0; left: 0; right: 0;
        padding: 24px;
        background: linear-gradient(to top, var(--bg) 70%, transparent);
        pointer-events: none;
      }
      .input-bar {
        max-width: 720px; margin: 0 auto;
        background: white;
        border: 1.5px solid var(--line);
        border-radius: 18px;
        padding: 6px 6px 6px 18px;
        display: flex; align-items: center; gap: 8px;
        box-shadow: 0 6px 24px -10px rgba(42,39,37,0.16);
        pointer-events: auto;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .input-bar:focus-within {
        border-color: var(--o);
        box-shadow: 0 0 0 4px rgba(255,107,53,0.12), 0 6px 24px -10px rgba(42,39,37,0.16);
      }
      .input-bar input {
        flex: 1; border: none; padding: 12px 0;
        font-size: 16px; background: transparent; color: var(--d);
      }
      .input-bar input::placeholder { color: rgba(42,39,37,0.4); }
      .input-bar input:disabled { color: var(--d-soft); cursor: not-allowed; }

      .send-btn {
        width: 40px; height: 40px;
        border-radius: 12px; border: none;
        background: var(--o); color: white;
        font-size: 18px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: opacity 0.2s, transform 0.15s;
      }
      .send-btn:hover { transform: translateX(2px); }
      .send-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

      .jump-pill {
        position: absolute;
        bottom: 130px; left: 50%;
        transform: translateX(-50%);
        width: 64px; height: 22px;
        background: var(--d); border: none;
        border-radius: 999px; cursor: pointer;
        z-index: 10;
        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        transition: transform 0.18s;
      }
      .jump-pill:hover { transform: translateX(-50%) scale(1.06); }

      .primary-btn {
        padding: 14px 24px;
        background: var(--d); color: white;
        border: none; border-radius: 12px;
        font-size: 14px; font-weight: 700;
        letter-spacing: 0.02em; cursor: pointer;
        transition: background 0.18s, transform 0.15s;
      }
      .primary-btn:hover { background: #15110f; transform: translateY(-1px); }

      .primary-btn-sm {
        padding: 9px 16px;
        background: var(--o); color: white;
        border: none; border-radius: 9px;
        font-size: 12.5px; font-weight: 700;
        cursor: pointer; transition: background 0.18s;
      }
      .primary-btn-sm:hover { background: #e85e28; }

      .ghost-btn-sm {
        padding: 9px 14px;
        background: transparent; color: var(--d-soft);
        border: 1px solid var(--line); border-radius: 9px;
        font-size: 12.5px; font-weight: 600;
        cursor: pointer;
        transition: border-color 0.18s, color 0.18s;
      }
      .ghost-btn-sm:hover { border-color: var(--d-soft); color: var(--d); }

      .panel {
        position: fixed; top: 64px; right: 18px;
        width: 280px;
        background: var(--d); color: white;
        border-radius: 14px;
        padding: 18px 18px 16px;
        z-index: 250;
        box-shadow: 0 16px 48px -10px rgba(0,0,0,0.4);
        max-height: calc(100vh - 80px);
        overflow-y: auto;
      }
      .panel h4 {
        font-size: 11px; letter-spacing: 0.1em;
        text-transform: uppercase; opacity: 0.5;
        margin-bottom: 10px; font-weight: 600;
      }
      .panel-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 0; font-size: 13px;
      }
      .panel-row .key {
        font-family: 'Menlo', monospace;
        background: rgba(255,255,255,0.08);
        padding: 3px 7px; border-radius: 5px;
        font-size: 11px;
      }
      .panel-divider {
        height: 1px; background: rgba(255,255,255,0.1);
        margin: 12px 0;
      }
      .panel-jump-btn {
        width: 100%; padding: 8px 12px;
        background: rgba(255,255,255,0.05);
        color: white; border: none;
        border-radius: 7px;
        font-size: 12.5px; font-weight: 600;
        cursor: pointer; margin-top: 4px;
        text-align: left;
        transition: background 0.18s;
        display: flex; justify-content: space-between; align-items: center;
      }
      .panel-jump-btn:hover { background: rgba(255,255,255,0.12); }
      .panel-jump-btn.current { background: rgba(255,107,53,0.22); }

      .panel-btn {
        width: 100%; padding: 9px 12px;
        background: rgba(255,255,255,0.08);
        color: white; border: none; border-radius: 8px;
        font-size: 12.5px; font-weight: 600;
        cursor: pointer; margin-top: 6px;
        text-align: left; transition: background 0.18s;
      }
      .panel-btn:hover { background: rgba(255,255,255,0.14); }
      .panel-btn.primary { background: var(--o); }
      .panel-btn.primary:hover { background: #e85e28; }

      /* Dashboard */
      .app-frame {
        flex: 1; display: flex;
        height: 100vh; overflow: hidden;
      }
      .app-sidebar {
        width: 240px; flex-shrink: 0;
        background: var(--app-sidebar);
        color: white; padding: 22px 16px;
        overflow-y: auto;
      }
      .app-nav {
        display: flex; flex-direction: column;
        gap: 2px; margin-bottom: 24px;
      }
      .app-nav-item {
        display: flex; align-items: center;
        padding: 9px 12px;
        border-radius: 8px;
        background: transparent;
        color: rgba(255,255,255,0.7);
        border: none;
        font-size: 13.5px; font-weight: 500;
        cursor: pointer;
        transition: background 0.16s, color 0.16s;
        text-align: left;
      }
      .app-nav-item:hover { background: rgba(255,255,255,0.06); color: white; }
      .app-nav-item.active {
        background: rgba(255,107,53,0.22);
        color: #ffb89a;
      }
      .app-nav-item.locked {
        cursor: not-allowed;
        color: rgba(255,255,255,0.32);
      }
      .app-nav-icon {
        width: 18px; height: 18px;
        display: inline-flex; align-items: center; justify-content: center;
        margin-right: 10px; font-size: 12px; opacity: 0.7;
      }
      .app-nav-label { flex: 1; }
      .app-nav-badge {
        background: var(--o); color: white;
        font-size: 10px; font-weight: 700;
        padding: 1px 6px; border-radius: 100px;
      }
      .app-nav-lock {
        font-size: 9px; text-transform: uppercase;
        letter-spacing: 0.08em;
        background: rgba(255,255,255,0.08);
        padding: 2px 6px; border-radius: 4px;
        font-weight: 700;
      }
      .app-nav-section-title {
        font-size: 9.5px; text-transform: uppercase;
        letter-spacing: 0.14em;
        color: rgba(255,255,255,0.32);
        font-weight: 700;
        margin: 18px 12px 8px;
      }

      .app-main {
        flex: 1; display: flex; flex-direction: column;
        overflow: hidden;
      }
      .app-topbar {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 28px;
        border-bottom: 1px solid var(--line);
        background: rgba(255,255,255,0.7);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        flex-shrink: 0;
        position: relative;
        z-index: 10;
      }
      .app-search {
        display: flex; align-items: center;
        background: var(--bg-warm);
        border: 1px solid transparent;
        border-radius: 10px;
        padding: 8px 14px;
        width: 360px;
        transition: border-color 0.18s, background 0.18s;
      }
      .app-search:focus-within { background: white; border-color: var(--line); }
      .app-search input {
        flex: 1; border: none; background: transparent;
        font-size: 13px; color: var(--d);
      }
      .app-search input::placeholder { color: rgba(42,39,37,0.4); }

      .app-icon-btn {
        position: relative;
        width: 36px; height: 36px;
        background: var(--bg-warm);
        border: none; border-radius: 10px;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: var(--d-soft);
        transition: background 0.18s;
      }
      .app-icon-btn:hover { background: rgba(255,107,53,0.1); color: var(--o); }
      .app-notif-dot {
        position: absolute; top: 8px; right: 9px;
        width: 7px; height: 7px;
        border-radius: 50%;
        background: var(--o);
        border: 2px solid var(--bg-warm);
      }

      .account-pill {
        display: flex; align-items: center; gap: 10px;
        padding: 6px 14px 6px 6px;
        background: white;
        border: 1px solid var(--line);
        border-radius: 100px;
        cursor: pointer;
        transition: border-color 0.18s, box-shadow 0.18s;
      }
      .account-pill:hover {
        border-color: rgba(255,107,53,0.35);
        box-shadow: 0 2px 12px -4px rgba(255,107,53,0.18);
      }
      .account-avatar {
        width: 30px; height: 30px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--o), #e04a14);
        color: white;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 800;
        font-family: var(--fh); letter-spacing: 0.02em;
        overflow: hidden; flex-shrink: 0;
      }
      .account-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .account-avatar.large { width: 52px; height: 52px; font-size: 16px; }
      .account-pill-name {
        font-size: 12.5px; font-weight: 700;
        color: var(--d); line-height: 1.1;
      }
      .account-pill-role {
        font-size: 10.5px; color: var(--d-soft);
        line-height: 1.1; margin-top: 2px; font-style: italic;
      }

      .account-card {
        position: absolute; right: 0; top: calc(100% + 8px);
        width: 320px;
        background: white;
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 20px;
        box-shadow: 0 20px 60px -20px rgba(42,39,37,0.28);
        z-index: 9999;
      }
      .account-card-btn {
        display: block; width: 100%;
        padding: 10px 14px;
        font-size: 13px; font-weight: 600;
        color: var(--d-soft);
        background: var(--bg-warm);
        border: none; border-radius: 9px;
        cursor: pointer;
        text-align: left; text-decoration: none;
        margin-bottom: 7px;
        transition: background 0.18s, color 0.18s;
      }
      .account-card-btn:hover { background: var(--o-soft); color: var(--o); }
      .account-card-btn.primary { background: var(--o); color: white; }
      .account-card-btn.primary:hover { background: #e85e28; color: white; }
      .account-card-btn.subtle { background: transparent; color: var(--d-soft); }
      .account-card-btn.subtle:hover { background: var(--bg-warm); }

      .app-content {
        flex: 1; overflow-y: auto;
        padding: 32px 36px 60px;
        position: relative;
        z-index: 1;
      }

      .app-card {
        background: var(--app-surface);
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 22px 24px;
        transition: border-color 0.2s;
      }
      .app-card-head {
        display: flex; justify-content: space-between; align-items: baseline;
        margin-bottom: 14px;
      }
      .app-card-head h3 {
        font-size: 14px; font-weight: 700; color: var(--d);
      }
      .app-card-link {
        background: none; border: none;
        font-size: 12px; color: var(--o); cursor: pointer;
        font-weight: 600;
      }
      .app-card-h {
        font-size: 14px; font-weight: 700; color: var(--d);
        margin-bottom: 14px;
      }

      .stat-grid {
        display: grid; grid-template-columns: repeat(4, 1fr);
        gap: 14px;
      }
      @media (max-width: 1100px) {
        .stat-grid { grid-template-columns: repeat(2, 1fr); }
      }

      .stat-card {
        position: relative;
        background: var(--app-surface);
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 18px 20px 16px;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .stat-card:hover {
        border-color: rgba(255,107,53,0.25);
        box-shadow: 0 8px 24px -16px rgba(255,107,53,0.2);
      }
      .stat-label-row {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 10px;
      }
      .stat-label-name {
        font-size: 12px; color: var(--d-soft);
        font-weight: 600; letter-spacing: 0.02em;
      }
      .info-btn {
        width: 16px; height: 16px;
        border-radius: 50%;
        background: var(--bg-warm);
        color: var(--d-soft);
        border: none;
        font-size: 10px; font-weight: 700;
        cursor: help;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.18s, color 0.18s;
      }
      .info-btn:hover { background: var(--o-soft); color: var(--o); }

      .stat-value {
        font-family: var(--fh);
        font-size: 30px; font-weight: 900;
        letter-spacing: -0.04em;
        color: var(--d); line-height: 1;
        margin-bottom: 8px;
      }
      .stat-delta {
        font-size: 11.5px; font-weight: 600;
        font-style: italic;
      }
      .stat-delta.up { color: var(--o); }
      .stat-delta.down { color: #c0392b; }

      .info-tooltip {
        position: absolute;
        top: calc(100% + 8px);
        left: 0; right: 0;
        background: var(--d); color: white;
        border-radius: 12px;
        padding: 14px 16px;
        font-size: 12.5px; line-height: 1.5;
        z-index: 9999;
        box-shadow: 0 12px 32px -10px rgba(0,0,0,0.32);
      }
      .info-tooltip-title {
        font-weight: 700;
        margin-bottom: 4px;
        color: var(--o);
        font-size: 11px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .info-tooltip-body {
        opacity: 0.85;
        font-size: 12.5px; line-height: 1.55;
      }
      .info-tooltip-divider {
        height: 1px; background: rgba(255,255,255,0.12);
        margin: 10px 0;
      }
      .info-tooltip-why-label {
        color: var(--o);
        font-size: 10px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .dash-2col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      @media (max-width: 900px) {
        .dash-2col { grid-template-columns: 1fr; }
      }

      .task-row {
        display: flex; align-items: flex-start; gap: 12px;
        padding: 12px 0;
        border-bottom: 1px dashed var(--line);
      }
      .task-row:last-child { border-bottom: none; }
      .task-check {
        width: 18px; height: 18px;
        border: 1.5px solid var(--line);
        border-radius: 5px;
        flex-shrink: 0; margin-top: 2px;
        cursor: pointer;
        transition: border-color 0.18s;
      }
      .task-check:hover { border-color: var(--o); }
      .task-check.done {
        background: var(--o);
        border-color: var(--o);
        position: relative;
      }
      .task-check.done::after {
        content: '✓'; color: white; font-size: 11px;
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
      }
      .task-title {
        font-size: 13.5px; font-weight: 600; color: var(--d);
      }
      .task-meta {
        font-size: 11.5px; color: var(--d-soft);
        margin-top: 2px; font-style: italic;
      }
      .task-row.done .task-title { text-decoration: line-through; opacity: 0.5; }
      .task-day {
        font-size: 11px; font-weight: 700;
        color: var(--d-soft);
        background: var(--bg-warm);
        padding: 3px 9px;
        border-radius: 100px;
        flex-shrink: 0; align-self: center;
      }

      .draft-meta-row {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 12px;
      }
      .draft-channel {
        font-size: 11px; font-weight: 700; color: var(--o);
        letter-spacing: 0.06em; text-transform: uppercase;
      }
      .draft-status {
        font-size: 11px; color: var(--d-soft); font-style: italic;
      }
      .draft-body {
        font-size: 13.5px; color: var(--d);
        line-height: 1.6; white-space: pre-line;
      }
      .draft-card { transition: border-color 0.2s; }
      .draft-card:hover { border-color: rgba(255,107,53,0.25); }

      .cal-grid-large {
        display: grid; grid-template-columns: repeat(7, 1fr);
        gap: 6px;
      }
      .cal-head-large {
        font-size: 10px; font-weight: 700;
        text-align: center; color: var(--d-soft);
        text-transform: uppercase; letter-spacing: 0.08em;
        padding: 4px 0;
      }
      .cal-cell {
        aspect-ratio: 1.1;
        background: var(--bg-warm);
        border-radius: 8px;
        padding: 8px;
        display: flex; flex-direction: column;
        font-size: 11px; color: var(--d-soft);
        position: relative;
        transition: background 0.18s, border-color 0.18s, transform 0.18s;
        border: 1px solid transparent;
      }
      .cal-cell.empty { background: transparent; }
      .cal-cell.has {
        background: var(--cream);
        border-color: rgba(255,107,53,0.2);
        cursor: pointer;
      }
      .cal-cell.has:hover {
        border-color: rgba(255,107,53,0.5);
        transform: translateY(-1px);
      }
      .cal-cell.today {
        background: var(--d); color: white;
      }
      .cal-cell.today .cal-num { color: white; }
      .cal-num {
        font-size: 11px; font-weight: 700; color: var(--d);
      }
      .cal-pill {
        margin-top: auto;
        background: var(--o); color: white;
        padding: 4px 6px; border-radius: 5px;
        display: flex; flex-direction: column;
        gap: 1px; line-height: 1.1;
      }
      .cal-pill-channel {
        font-size: 8.5px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.04em;
        opacity: 0.8;
      }
      .cal-pill-title {
        font-size: 10px; font-weight: 600;
      }

      .bullet-list { list-style: none; padding: 0; }
      .bullet-list li {
        font-size: 13.5px; color: var(--d-soft);
        line-height: 1.55;
        padding: 5px 0 5px 18px;
        position: relative;
      }
      .bullet-list li::before {
        content: '';
        position: absolute;
        left: 0; top: 13px;
        width: 8px; height: 1px;
        background: var(--d-soft);
      }
      .bullet-list.orange li::before { background: var(--o); }

      .settings-row {
        display: flex; justify-content: space-between; align-items: baseline;
        padding: 10px 0;
        border-bottom: 1px dashed var(--line);
        font-size: 13px;
      }
      .settings-row:last-child { border-bottom: none; }
      .settings-label { color: var(--d-soft); font-size: 12px; }
      .settings-value {
        color: var(--d); font-weight: 600;
        text-align: right; max-width: 60%;
      }

      @media (max-width: 760px) {
        .app-sidebar { display: none; }
        .stat-grid { grid-template-columns: 1fr 1fr; }
      }
    `}</style>
  );
}
