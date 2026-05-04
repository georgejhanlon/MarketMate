/* ─────────────────────────────────────────────────────────────────────────
   /lib/industry-data.js
   Shared between the client (page.jsx) and the server route (api/strategy).
   No "use client" directive — usable from both contexts.

   If you change templates here, page.jsx will pick them up automatically
   IF you also import them from page.jsx (currently page.jsx has its own
   inline copies for portability — see note at bottom).
   ───────────────────────────────────────────────────────────────────────── */

export function detectIndustry(answers) {
  const text = answers.join(" ").toLowerCase();
  if (/(plumb|boiler|leak|drain|heating|electric|wiring|sparky|builder|construction|roofer|carpenter|joiner|painter|decorator|gas|landscape)/.test(text)) return "trade";
  if (/(salon|hair|barber|nails|beauty|colour|stylist|makeup|aesthetic|brow|lash|tan)/.test(text)) return "beauty";
  if (/(restaurant|fine din|bistro|gastropub|chef|tasting menu)/.test(text)) return "restaurant";
  if (/(cafe|coffee shop|coffee house|barista|brunch spot)/.test(text)) return "cafe";
  if (/(bakery|kitchen|caterer|catering|food truck|deli|takeaway)/.test(text)) return "hospo";
  if (/(yoga|pilates|fitness|gym|personal trainer|coach|therapist|nutrition|massage|physio)/.test(text)) return "wellness";
  if (/(photo|videograph|filmmaker|design|graphic|creative|studio|illustrator|brand designer)/.test(text)) return "creative";
  if (/(travel|trip|holiday|tour|cruise|vacation|travel counsel|travel agent)/.test(text)) return "travel";
  if (/(estate agent|realtor|property|lettings|sales agent|landlord)/.test(text)) return "estate";
  if (/(dog walk|pet sit|cat sit|grooming|kennel|cattery|pet care|dog trainer)/.test(text)) return "petcare";
  if (/(shop|boutique|retail|store|gift shop|florist|bookshop|bookstore)/.test(text)) return "retail";
  if (/(lawyer|solicitor|legal|barrister|conveyanc|paralegal|attorney)/.test(text)) return "legal";
  if (/(car deal|car sales|garage|mechanic|mot|autom|dealership|car wash)/.test(text)) return "cars";
  return "service";
}

export const STRATEGY_BY_INDUSTRY = {
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

export const DASH_DEFAULTS = {
  trade: {
    channels: [
      { name: "Google Business Profile", role: "primary", rationale: "Where 70%+ of local emergency callouts originate." },
      { name: "Instagram", role: "secondary", rationale: "Before/after work builds trust at thumbnail size." },
      { name: "Facebook", role: "support", rationale: "Local community groups still drive referrals in trade." },
    ],
    kpis: [
      { label: "Profile views", why: "Local search visibility — the upstream of every callout." },
      { label: "Direct calls", why: "The number that pays the bills." },
      { label: "Reviews", why: "Strongest local-pack ranking signal you can move." },
      { label: "Response time", why: "First to respond wins the job, full stop." },
    ],
    contentMix: [
      { channel: "Google Business Profile", format: "Photo + update", cadence: "weekly" },
      { channel: "Instagram", format: "Before/after reel", cadence: "weekly" },
      { channel: "Facebook", format: "Local community post", cadence: "2x-weekly" },
    ],
    icp: [
      { name: "Mid-life homeowner", description: "35-65, owns the property, has had a leak before, values someone reliable over someone cheap." },
      { name: "Letting agent / landlord", description: "Manages 5-30 properties, needs a trusted go-to for tenant emergencies." },
    ],
  },
  beauty: {
    channels: [
      { name: "Instagram", role: "primary", rationale: "Where bookings happen for beauty. Reels + DMs do the heavy lifting." },
      { name: "Google Business Profile", role: "secondary", rationale: "Walk-up search traffic — underused in beauty, your easiest win." },
      { name: "Email", role: "support", rationale: "Rebooking lapsed clients is 5x cheaper than acquiring new ones." },
    ],
    kpis: [
      { label: "Reach", why: "First signal that content is landing locally." },
      { label: "DMs / bookings", why: "Direct conversion in beauty." },
      { label: "Rebook rate", why: "Existing clients drive 70% of beauty revenue." },
      { label: "Reviews", why: "Decision driver for first-time bookings." },
    ],
    contentMix: [
      { channel: "Instagram", format: "Transformation reel", cadence: "2x-weekly" },
      { channel: "Instagram", format: "BTS story", cadence: "weekly" },
      { channel: "Google Business Profile", format: "Photo update", cadence: "weekly" },
      { channel: "Email", format: "Rebooking nudge", cadence: "monthly" },
    ],
    icp: [
      { name: "Local regular", description: "25-55, lives within 3 miles, books every 6-8 weeks once she trusts you." },
      { name: "Event-driven first-timer", description: "Wedding, milestone birthday, holiday — needs reassurance, picks on reviews + Insta." },
    ],
  },
  restaurant: {
    channels: [
      { name: "Google Business Profile", role: "primary", rationale: "Where 'where shall we eat?' actually gets answered." },
      { name: "Instagram", role: "primary", rationale: "Plate shots and atmosphere — locals follow local restaurants." },
      { name: "Email", role: "secondary", rationale: "Repeat business is your margin. Monthly note keeps you top of mind." },
      { name: "TikTok", role: "support", rationale: "Younger diners — chef BTS travels surprisingly far." },
    ],
    kpis: [
      { label: "Profile views", why: "Direct upstream of bookings on a Friday night." },
      { label: "Bookings", why: "The number that pays the bills." },
      { label: "Reviews", why: "First-impression trust signal — the majority decide on this." },
      { label: "Engagement rate", why: "Tells you if your content is actually shareable, or just visible." },
    ],
    contentMix: [
      { channel: "Instagram", format: "Plate shot", cadence: "2x-weekly" },
      { channel: "Google Business Profile", format: "Photo + update", cadence: "weekly" },
      { channel: "TikTok", format: "Chef BTS reel", cadence: "weekly" },
      { channel: "Email", format: "Monthly newsletter", cadence: "monthly" },
    ],
    icp: [
      { name: "Local diner", description: "Within a 1-mile radius, decides where to eat in 30 seconds on their phone." },
      { name: "Special-occasion booker", description: "Anniversaries, birthdays, work dinners — books a week ahead, expects a reply within hours." },
    ],
  },
  cafe: {
    channels: [
      { name: "Google Business Profile", role: "primary", rationale: "Walk-ups and morning coffee searchers — a 50+ review profile moves you up the local pack." },
      { name: "Instagram", role: "primary", rationale: "Three-a-week rhythm: drinks, mood, BTS. Locals follow locals." },
      { name: "Email", role: "support", rationale: "A monthly 'what's new this month' note quietly turns drop-ins into regulars." },
    ],
    kpis: [
      { label: "Profile views", why: "Walk-ups on the way to work — your highest-intent traffic." },
      { label: "Reach", why: "How many local Instagram users actually saw the cafe this week." },
      { label: "Reviews", why: "50+ Google reviews moves you out of obscurity in local search." },
      { label: "Engagement rate", why: "Above 5% means content is genuinely landing with regulars." },
    ],
    contentMix: [
      { channel: "Instagram", format: "Drinks/food post", cadence: "2x-weekly" },
      { channel: "Instagram", format: "BTS story", cadence: "weekly" },
      { channel: "Google Business Profile", format: "Photo + update", cadence: "weekly" },
      { channel: "Email", format: "Monthly newsletter", cadence: "monthly" },
    ],
    icp: [
      { name: "Daily regular", description: "Lives or works within 5 minutes' walk, 3+ visits a week, defaults to you for routine." },
      { name: "Weekend wanderer", description: "Picks the best-looking option on Google Maps — judges you on photos and reviews in 10 seconds." },
    ],
  },
  hospo: {
    channels: [
      { name: "Google Business Profile", role: "primary", rationale: "Hyper-local searches decide it — daily updates, fast review responses." },
      { name: "Instagram", role: "secondary", rationale: "Twice weekly. Food, room, the people behind it." },
      { name: "Email", role: "support", rationale: "Monthly newsletter with a soft offer keeps repeat business healthy." },
    ],
    kpis: [
      { label: "Profile views", why: "Direct upstream of footfall." },
      { label: "Bookings / orders", why: "The number that pays the bills." },
      { label: "Reviews", why: "Strongest signal in local food search." },
      { label: "Engagement rate", why: "Tells you if your content is shareable or just decorative." },
    ],
    contentMix: [
      { channel: "Google Business Profile", format: "Photo + update", cadence: "weekly" },
      { channel: "Instagram", format: "Food/room post", cadence: "2x-weekly" },
      { channel: "Email", format: "Monthly newsletter", cadence: "monthly" },
    ],
    icp: [
      { name: "Local resident", description: "Within 1 mile, picks based on Google + Instagram in under 60 seconds." },
      { name: "Repeat customer", description: "Already loves you — needs a reason to come back this month." },
    ],
  },
  wellness: {
    channels: [
      { name: "Instagram", role: "primary", rationale: "Short-form authority video drives bookings — people book the person who's already taught them something." },
      { name: "Google Business Profile", role: "secondary", rationale: "Most wellness practitioners do nothing here. Easy place to stand out." },
      { name: "Email", role: "support", rationale: "Monthly note with one practical thing keeps you top of mind for repeat sessions." },
    ],
    kpis: [
      { label: "Reach", why: "Authority content needs to be seen by enough people for trust to build." },
      { label: "Profile views", why: "Warm leads researching whether you're the right fit." },
      { label: "Bookings", why: "The number that pays the bills." },
      { label: "Engagement rate", why: "Above 6% in wellness means your content is genuinely landing." },
    ],
    contentMix: [
      { channel: "Instagram", format: "Authority tip reel", cadence: "2x-weekly" },
      { channel: "Google Business Profile", format: "Update + photo", cadence: "weekly" },
      { channel: "Email", format: "Monthly note", cadence: "monthly" },
    ],
    icp: [
      { name: "Symptom-driven first-timer", description: "Has a specific issue (back pain, sleep, stress), researches for weeks, books once they trust your expertise." },
      { name: "Wellness-curious regular", description: "Treats sessions as ongoing maintenance — books in blocks, responds to consistency." },
    ],
  },
  creative: {
    channels: [
      { name: "Instagram", role: "primary", rationale: "Process content outperforms finished work for visibility — people hire what they see being made." },
      { name: "LinkedIn", role: "secondary", rationale: "Where business decision-makers actually look for creative partners." },
      { name: "Email", role: "support", rationale: "Cold outreach + warm referrals — most creatives won't do it, which is why it works." },
    ],
    kpis: [
      { label: "Reach", why: "How many decision-makers actually saw your work this week." },
      { label: "Profile visits", why: "Warm signal — someone's checking if you're a fit for an upcoming project." },
      { label: "Enquiries", why: "The number that pays the bills." },
      { label: "Engagement rate", why: "Tells you if your portfolio is sticky or just visible." },
    ],
    contentMix: [
      { channel: "Instagram", format: "Process reel", cadence: "2x-weekly" },
      { channel: "LinkedIn", format: "Case study post", cadence: "weekly" },
      { channel: "Email", format: "Cold outreach batch", cadence: "weekly" },
    ],
    icp: [
      { name: "Local SME marketing lead", description: "Has budget, knows what they want, judges you on portfolio + responsiveness." },
      { name: "Repeat client", description: "Worked with you before — comes back if they remember you. Stay visible." },
    ],
  },
  travel: {
    channels: [
      { name: "Instagram", role: "primary", rationale: "Trip carousels are the single highest-converting content in travel." },
      { name: "Email", role: "primary", rationale: "Travel decisions are slow — email keeps you in the conversation for months." },
      { name: "LinkedIn", role: "support", rationale: "Corporate and high-value clients still search here." },
    ],
    kpis: [
      { label: "Reach", why: "Audience growth in your niche — directly upstream of enquiries." },
      { label: "Enquiries", why: "The number that pays the bills." },
      { label: "Repeat / referral rate", why: "Travel runs on word-of-mouth — this is the long game." },
      { label: "Engagement rate", why: "Tells you if your trip stories are landing or just scrolling past." },
    ],
    contentMix: [
      { channel: "Instagram", format: "Trip story carousel", cadence: "weekly" },
      { channel: "Email", format: "Monthly newsletter", cadence: "monthly" },
      { channel: "LinkedIn", format: "Niche-expertise post", cadence: "weekly" },
    ],
    icp: [
      { name: "Niche traveller", description: "Has a specific kind of trip in mind (honeymoon, multigen, milestone) — wants someone who's done it before." },
      { name: "Repeat / referral client", description: "Already trusts you — the easiest sale is their next trip or their friend's." },
    ],
  },
  estate: {
    channels: [
      { name: "Instagram", role: "primary", rationale: "Property tours + walkthrough reels — vendors notice the agent who shows up consistently." },
      { name: "Email", role: "primary", rationale: "Monthly local market update keeps you top of mind for the 6-12 month vendor pipeline." },
      { name: "Google Business Profile", role: "secondary", rationale: "AllAgents + Google reviews are what vendors check before instructing." },
      { name: "TikTok", role: "support", rationale: "Younger sellers and renters search property here now." },
    ],
    kpis: [
      { label: "Profile views", why: "Vendors checking you out before instructing." },
      { label: "Valuation requests", why: "Top of the pipeline — directly upstream of instructions." },
      { label: "Reviews", why: "The trust signal that closes the instruction." },
      { label: "Listing views", why: "How visible your stock is to active buyers." },
    ],
    contentMix: [
      { channel: "Instagram", format: "Listing walkthrough reel", cadence: "2x-weekly" },
      { channel: "Email", format: "Monthly market update", cadence: "monthly" },
      { channel: "Google Business Profile", format: "Listing update", cadence: "weekly" },
      { channel: "TikTok", format: "Property tour", cadence: "weekly" },
    ],
    icp: [
      { name: "Considering-vendor", description: "Thinking about selling in the next 6-12 months — needs to see you active in their patch before deciding." },
      { name: "Active buyer", description: "Browsing weekly, judges shortlist on photos, video, and how quickly you respond." },
    ],
  },
  petcare: {
    channels: [
      { name: "Google Business Profile", role: "primary", rationale: "Owners search 'dog walker near me' and pick from the top three." },
      { name: "Instagram", role: "primary", rationale: "Pack walk content — owners follow local pet accounts religiously." },
      { name: "Facebook", role: "support", rationale: "Local pet community groups drive a lot of word-of-mouth." },
    ],
    kpis: [
      { label: "Profile views", why: "Direct upstream of new client enquiries." },
      { label: "DMs / enquiries", why: "The number that pays the bills." },
      { label: "Reviews", why: "Trust signal for owners letting strangers near their dogs." },
      { label: "Engagement rate", why: "Pet content travels — high engagement means the dog community knows you." },
    ],
    contentMix: [
      { channel: "Instagram", format: "Pack walk reel", cadence: "2x-weekly" },
      { channel: "Google Business Profile", format: "Photo + update", cadence: "weekly" },
      { channel: "Facebook", format: "Local group post", cadence: "weekly" },
    ],
    icp: [
      { name: "Working dog owner", description: "Out 8-10 hours, needs daily walks, books regular slots once they trust you." },
      { name: "Holiday client", description: "Books pet-sitting around trips — referrals from regulars are gold." },
    ],
  },
  retail: {
    channels: [
      { name: "Instagram", role: "primary", rationale: "Personality-driven content beats polished brand — three short posts a week." },
      { name: "Google Business Profile", role: "secondary", rationale: "Tourists and new locals search here — most independents have nothing." },
      { name: "Email", role: "support", rationale: "Quietly the most profitable channel a shop has, and almost no one uses it well." },
    ],
    kpis: [
      { label: "Profile views", why: "Discovery — locals and tourists deciding if you're worth a visit." },
      { label: "Footfall", why: "The number that pays the bills (online sales are a bonus)." },
      { label: "Reviews", why: "Independent shops live or die on personality reviews." },
      { label: "Email subscribers", why: "Your most loyal customers — and the most profitable channel you've got." },
    ],
    contentMix: [
      { channel: "Instagram", format: "New-in reel", cadence: "weekly" },
      { channel: "Instagram", format: "BTS post", cadence: "weekly" },
      { channel: "Google Business Profile", format: "Photo + update", cadence: "weekly" },
      { channel: "Email", format: "Monthly newsletter", cadence: "monthly" },
    ],
    icp: [
      { name: "Loyal local", description: "Comes in monthly, knows your name, joins your email list — the heart of the business." },
      { name: "Discovery shopper", description: "Tourist or new resident — picks based on Google photos and Instagram personality." },
    ],
  },
  legal: {
    channels: [
      { name: "Google Business Profile", role: "primary", rationale: "Clients Google a problem at 11pm and pick the firm that looks most credible in 30 seconds." },
      { name: "LinkedIn", role: "primary", rationale: "Where professional referrers (accountants, IFAs) actually pay attention to you." },
      { name: "Email", role: "support", rationale: "Quarterly referrer check-ins generate 80% of the work in many specialisms." },
    ],
    kpis: [
      { label: "Profile views", why: "First-impression trust signal during the late-night search." },
      { label: "Enquiries", why: "The number that pays the bills." },
      { label: "Reviews", why: "Substance over volume — five recent professional reviews close cases." },
      { label: "Referrer engagement", why: "Long-term — most legal work comes from professional referrers." },
    ],
    contentMix: [
      { channel: "LinkedIn", format: "Practical Q&A post", cadence: "weekly" },
      { channel: "Google Business Profile", format: "Update + photo", cadence: "monthly" },
      { channel: "Email", format: "Quarterly referrer note", cadence: "monthly" },
    ],
    icp: [
      { name: "Stressed first-time client", description: "Late-night Google searcher with a real problem — judges credibility in 30 seconds." },
      { name: "Professional referrer", description: "Accountant, IFA, mortgage broker — sends you work if you stay on their radar." },
    ],
  },
  cars: {
    channels: [
      { name: "Instagram", role: "primary", rationale: "Stock reels — buyers research for weeks before walking in, give them what they need." },
      { name: "Google Business Profile", role: "primary", rationale: "100+ Google reviews can lift conversion by 20%+ in used cars." },
      { name: "Email", role: "support", rationale: "Most enquiries buy 4-8 weeks later — follow-up sequences recover serious revenue." },
    ],
    kpis: [
      { label: "Listing views", why: "How many serious buyers are seeing your stock." },
      { label: "Enquiries", why: "The number that pays the bills." },
      { label: "Reviews", why: "100+ Google reviews is a 20%+ conversion lift in used cars." },
      { label: "Lead recovery rate", why: "% of cold enquiries that convert weeks later — pure margin." },
    ],
    contentMix: [
      { channel: "Instagram", format: "Stock reel", cadence: "2x-weekly" },
      { channel: "Google Business Profile", format: "Photo + update", cadence: "weekly" },
      { channel: "Email", format: "Follow-up sequence", cadence: "weekly" },
    ],
    icp: [
      { name: "Researching buyer", description: "Has been looking for 3-6 weeks, knows what they want, decides on photos and reviews." },
      { name: "Cold lead", description: "Enquired weeks ago and went quiet — recoverable with the right follow-up cadence." },
    ],
  },
  service: {
    channels: [
      { name: "Google Business Profile", role: "primary", rationale: "Highest-leverage channel for any local service business — weekly updates and reviews compound." },
      { name: "Instagram", role: "secondary", rationale: "Authority and trust content — twice a week is plenty." },
      { name: "Email", role: "support", rationale: "Past customers are your warmest pipeline." },
    ],
    kpis: [
      { label: "Profile views", why: "Local discoverability — the upstream of everything." },
      { label: "Enquiries", why: "The number that pays the bills." },
      { label: "Response time", why: "First to respond wins more often than not." },
      { label: "Reviews", why: "Local-pack ranking + first-impression trust signal." },
    ],
    contentMix: [
      { channel: "Google Business Profile", format: "Update + photo", cadence: "weekly" },
      { channel: "Instagram", format: "Authority post", cadence: "weekly" },
      { channel: "Email", format: "Past-customer note", cadence: "monthly" },
    ],
    icp: [
      { name: "Local searcher", description: "Found you by Googling the service + town. Decides on first impressions in 30 seconds." },
      { name: "Past customer", description: "Already hired you once — 5x more likely to hire again than a stranger." },
    ],
  },
};
