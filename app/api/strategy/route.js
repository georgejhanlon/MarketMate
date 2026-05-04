/* ─────────────────────────────────────────────────────────────────────────
   /app/api/strategy/route.js
   Takes the chat profile, picks the right industry template, then asks the
   LLM to personalise it. Returns a Strategy object the dashboard consumes.

   This route imports STRATEGY_BY_INDUSTRY, DASH_DEFAULTS, detectIndustry
   from page.jsx via a small re-export — but server routes can't import a
   "use client" file. So we duplicate the minimum needed here. Keep this
   in sync if you tweak the templates in page.jsx.

   ALTERNATIVE (cleaner): extract STRATEGY_BY_INDUSTRY, DASH_DEFAULTS,
   detectIndustry into /lib/industry-data.js (no "use client" directive)
   and import from both page.jsx and this route. Recommended for the next
   iteration. For now, kept inline to minimise file changes.
   ───────────────────────────────────────────────────────────────────────── */

import Anthropic from "@anthropic-ai/sdk";
import { STRATEGY_BY_INDUSTRY, DASH_DEFAULTS, detectIndustry } from "@/lib/industry-data";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PERSONALISE_PROMPT = `You're personalising a marketing strategy for a specific business. You'll receive:
1. A pre-written diagnosis + 3 pillars (the template — DO NOT discard the structure or insights)
2. The business profile from the discovery call

Your job: rewrite the diagnosis + each pillar's body to feel specifically about THIS business. Mention details from the chat where natural — their location, customer type, what they're doing now, what they want. Keep the template's actual insight; don't dilute it. Don't add new pillars or remove any.

Return ONLY this JSON (no markdown, no preamble):
{
  "diagnosis": "<2-3 sentences, personalised>",
  "pillars": [
    { "title": "<keep the original title>", "body": "<personalised, ~40-60 words, references their business>" },
    { "title": "<keep the original title>", "body": "<personalised>" },
    { "title": "<keep the original title>", "body": "<personalised>" }
  ],
  "ninetyDayPriorities": [
    { "month": 1, "focus": "<one specific thing for month 1, ~15-20 words>" },
    { "month": 2, "focus": "<one specific thing for month 2>" },
    { "month": 3, "focus": "<one specific thing for month 3>" }
  ]
}

Voice: British English, plain, slightly understated. No emojis. No "leverage" or "synergy" or "unlock". Talk like a strategist who's been doing this 10 years.`;

export async function POST(req) {
  try {
    const { profile } = await req.json();

    const combined = [profile.what, profile.who, profile.currentMarketing, profile.goal]
      .filter(Boolean).join(" ");
    const industry = detectIndustry([combined]);

    const template = STRATEGY_BY_INDUSTRY[industry] || STRATEGY_BY_INDUSTRY.service;
    const dash = DASH_DEFAULTS[industry] || DASH_DEFAULTS.service;

    const userMsg = `Business profile:
- What they do: ${profile.what || "(not specified)"}
- Who they serve: ${profile.who || "(not specified)"}
- Where: ${profile.where || "(not specified)"}
- Current marketing: ${profile.currentMarketing || "(not specified)"}
- What they want: ${profile.goal || "(not specified)"}

Template diagnosis: "${template.diagnosis}"

Template pillars:
${template.pillars.map((p, i) => `${i + 1}. ${p.title}: ${p.body}`).join("\n")}

Personalise these. Keep the structure and the insight. Make it feel about THIS business.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 900,
      system: PERSONALISE_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/, "")
      .trim();

    let personalised;
    try {
      personalised = JSON.parse(raw);
    } catch (e) {
      console.warn("[strategy] failed to parse model response, using template:", raw);
      personalised = {
        diagnosis: template.diagnosis,
        pillars: template.pillars,
        ninetyDayPriorities: [
          { month: 1, focus: "Set up the foundations — Google Business Profile, basic content cadence, review-asking system." },
          { month: 2, focus: "Hit consistency — content shipping reliably each week, response times under 2 hours." },
          { month: 3, focus: "Optimise — double down on what's working, kill what isn't, plan the next quarter." },
        ],
      };
    }

    // Validate pillar count — fall back to template if LLM dropped or added pillars
    if (!Array.isArray(personalised.pillars) || personalised.pillars.length !== template.pillars.length) {
      personalised.pillars = template.pillars;
    }

    const strategy = {
      business: { ...profile, industry },
      diagnosis: personalised.diagnosis || template.diagnosis,
      pillars: personalised.pillars,
      quickWins: template.quickWins,
      channels: dash.channels,
      kpis: dash.kpis,
      contentMix: dash.contentMix,
      icp: dash.icp,
      ninetyDayPriorities: personalised.ninetyDayPriorities || [
        { month: 1, focus: "Set up the foundations." },
        { month: 2, focus: "Hit consistency." },
        { month: 3, focus: "Optimise what's working." },
      ],
    };

    return Response.json(strategy);
  } catch (err) {
    console.error("[strategy] handler error:", err);
    return Response.json(
      { error: "internal", message: err?.message || "unknown" },
      { status: 500 }
    );
  }
}
