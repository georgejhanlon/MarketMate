/* ─────────────────────────────────────────────────────────────────────────
   /app/api/chat/route.js
   Adaptive intake endpoint. Called once per user turn from page.jsx.
   Returns either { decision: 'ask_next', ack, question, extracted }
   or         { decision: 'have_enough', closing, extracted }.

   Set ANTHROPIC_API_KEY in your .env.local before running.
   ───────────────────────────────────────────────────────────────────────── */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You're Mate — a sharp UK marketing strategist on a discovery call with a small business owner. You speak plainly, like someone who's been doing this for ten years and doesn't need to perform.

Your job on this call: gather just enough to write them a useful 90-day GTM plan. You need a working sense of:
  - What they do (industry, what they actually sell)
  - Who buys it (consumer/business, local/national, repeat/one-off)
  - Where they're based (for local SEO + tone)
  - What they're doing now for marketing (what's working, what isn't)
  - What "better" looks like for them (more leads? specific revenue? specific bottleneck?)

You DO NOT need to ask about all of these. Most owners give you 60-70% in their first answer. Build on what they've said. Don't re-ask things they've already told you, even tangentially.

HARD RULES:
  - Maximum 7 questions total across the whole call. Fewer is much better.
  - One question per turn. No multi-part questions joined with "and".
  - When you have enough to write a strategy, stop. Don't pad.
  - British English. No emojis. No exclamation marks. No "I'd love to" / "I'm excited to".
  - Conversational, not a form. "Right, what about—" beats "My next question is—".

Each turn, you receive the conversation so far and must respond with ONLY this JSON shape (no markdown, no preamble):

{
  "extracted": {
    "what": "<one sentence on what they sell, or null>",
    "who": "<one sentence on customer type, or null>",
    "where": "<UK location if mentioned, or null>",
    "currentMarketing": "<what they're doing now, or null>",
    "goal": "<what success looks like to them, or null>"
  },
  "decision": "ask_next" OR "have_enough",
  "next_question": "<the next question to ask, in your voice — only if decision is ask_next>",
  "acknowledgement": "<a short, natural reaction to what they just said, max 12 words — only if decision is ask_next. Goes BEFORE the question. e.g. 'Family-run, love that.' or 'Honest answer, appreciate it.' Skip (use empty string) if it would feel forced.>",
  "closing_line": "<a short sign-off if decision is have_enough — e.g. 'Right, give me a moment, putting something together.'>"
}

Decide "have_enough" when:
  - You have a clear sense of what+who+where, AND
  - You know roughly what they're doing now (even if the answer is "nothing"), AND
  - You have at least a directional sense of what they want more of.

You don't need every field filled. A plumber in Buckinghamshire who's "doing some Facebook, mostly word of mouth, want one more job a week" is enough — stop there.

If they give you a wall of detail in turn 1, you might have enough already. Trust that.`;

export async function POST(req) {
  try {
    const { history, questionsAsked } = await req.json();

    // Hard floor + ceiling — enforced regardless of model decision
    const forceStop = questionsAsked >= 7;
    const forceContinue = questionsAsked < 1;

    const messages = (history || []).map((t) => ({
      role: t.from === "user" ? "user" : "assistant",
      content: t.text,
    }));

    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return Response.json({ error: "expected user turn at end of history" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      system: SYSTEM_PROMPT + (forceStop ? "\n\nIMPORTANT: You've already asked 7 questions. You MUST set decision to 'have_enough' this turn." : ""),
      messages,
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

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // Model didn't return valid JSON — graceful fallback
      console.warn("[chat] failed to parse model response:", raw);
      return Response.json({
        decision: "ask_next",
        ack: null,
        question: "Tell me a bit more — anything you think I should know?",
        extracted: {},
      });
    }

    // Apply guardrails
    let decision = parsed.decision;
    if (forceStop) decision = "have_enough";
    if (forceContinue && decision === "have_enough") decision = "ask_next";

    if (decision === "ask_next") {
      const ack = parsed.acknowledgement?.trim();
      const q = parsed.next_question?.trim() || "Tell me a bit more about that.";
      return Response.json({
        decision: "ask_next",
        ack: ack && ack.length > 0 ? ack : null,
        question: q,
        extracted: parsed.extracted || {},
      });
    }

    return Response.json({
      decision: "have_enough",
      closing: parsed.closing_line?.trim() || "Right — give me a moment, putting something together.",
      extracted: parsed.extracted || {},
    });
  } catch (err) {
    console.error("[chat] handler error:", err);
    return Response.json(
      { error: "internal", message: err?.message || "unknown" },
      { status: 500 }
    );
  }
}
