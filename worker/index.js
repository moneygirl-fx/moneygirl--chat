const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });

function clean(value = "") {
  return String(value).replace(/\r/g, "").trim();
}

function isolateChat(raw = "") {
  return clean(raw)
    .split(/\n\s*--- LOGBOOK ENTRIES ---/i)[0]
    .split(/\n\s*--- PERSONA PROFILE/i)[0];
}

function lastSeven(raw = "") {
  const lines = isolateChat(raw)
    .split(/\n/)
    .map(x => x.trim())
    .filter(Boolean)
    .filter(x => /^(Me|Agent|You|Assistant|Customer|Client|User):\s*/i.test(x))
    .map(x => x
      .replace(/^(Agent|You|Assistant):\s*/i, "Me: ")
      .replace(/^(Client|User):\s*/i, "Customer: ")
    );

  return lines.slice(-7);
}

function latestCustomer(turns = []) {
  for (let i = turns.length - 1; i >= 0; i--) {
    const m = turns[i].match(/^Customer:\s*(.+)$/i);
    if (m) return m[1].trim();
  }
  return "";
}

function firstReplyOnly(value = "") {
  let text = clean(value);
  const markers = [
    /\n\s*\n/,
    /\n\s*(?:Option|Alternative|Reply)\s*2/i,
    /\n\s*2[.)]\s+/i,
    /\n\s*(?:Customer|User|Assistant|Agent|Me):\s*/i
  ];
  let cut = -1;
  for (const pattern of markers) {
    const m = pattern.exec(text);
    if (m && (cut === -1 || m.index < cut)) cut = m.index;
  }
  if (cut >= 0) text = text.slice(0, cut);
  return text
    .replace(/^(Me|Agent|Assistant|You|Customer):\s*/i, "")
    .replace(/^"|"$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function callNoTrack(env, messages) {
  if (!env.NOTRACK_API_KEY) throw new Error("NOTRACK_API_KEY secret is missing");

  const r = await fetch("https://api.notrack.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.NOTRACK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "notrack-uncensored",
      messages,
      temperature: 0.62,
      max_tokens: 100,
      frequency_penalty: 0.55,
      presence_penalty: 0.05,
      n: 1,
      stream: false,
      stop: ["\n\n", "\nOption 2", "\nAlternative", "\nReply 2", "\nCustomer:", "\nAssistant:"]
    })
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || data?.error || `NoTrack HTTP ${r.status}`);
  return data;
}

async function getLearning(env) {
  if (!env.LEARNING_KV) return [];
  try {
    const data = await env.LEARNING_KV.get("learning_history", "json");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function relevantExamples(examples, latest, limit = 2) {
  const words = latest.toLowerCase().replace(/[^a-z0-9\s']/g, " ").split(/\s+/).filter(w => w.length > 3);
  return examples
    .map((ex, i) => {
      const incoming = clean(ex.incoming || "").toLowerCase();
      let score = 0;
      for (const w of words) if (incoming.includes(w)) score += 2;
      return { ...ex, score, i };
    })
    .filter(x => x.score > 0 && x.final)
    .sort((a, b) => b.score - a.score || b.i - a.i)
    .slice(0, limit);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        ok: true,
        provider: "NoTrack",
        model: "notrack-uncensored",
        cloud: true
      });
    }

    if (url.pathname === "/suggest-reply" && request.method === "POST") {
      try {
        const body = await request.json();

        const raw =
          body.latestCustomerMessage ||
          body.message ||
          body.conversation ||
          "";

        const turnsFromLatest = lastSeven(body.latestCustomerMessage || "");
        const turnsFromConversation = lastSeven(body.conversation || "");
        const turns = turnsFromLatest.length ? turnsFromLatest : turnsFromConversation;

        const context = turns.join("\n");
        let latest = latestCustomer(turns);

        if (!latest) {
          latest = clean(body.latestCustomerMessage || body.message || raw);
        }

        const learning = relevantExamples(await getLearning(env), latest, 2);
        const style = Array.isArray(body.myStyle) ? body.myStyle.slice(-2) : [];

        const system = `Write ONE natural adult chat draft for human review.
Use the last 7 chat turns as the source of truth.
Reply directly to the latest customer message and stay on the same topic.
Do not invent names, jobs, relationship history, locations, media, calls, travel, meetups, or actions that are not in the context.
Do not copy facts from style examples.
Return one paragraph only, 150-300 characters, 2-3 short sentences.
End with exactly one context-specific open-ended question.
No alternatives, labels, scripts, or second reply.`;

        const messages = [{ role: "system", content: system }];

        if (learning.length) {
          messages.push({
            role: "system",
            content: "Style-only examples:\n" + learning.map((x, i) => `${i + 1}. ${String(x.final).slice(0, 280)}`).join("\n")
          });
        }

        if (style.length) {
          messages.push({
            role: "system",
            content: "Recent writing style only:\n" + style.map(x => `- ${String(x).slice(0, 220)}`).join("\n")
          });
        }

        messages.push({
          role: "user",
          content: `LAST 7 CHAT TURNS:\n${context || "(latest message only)"}\n\nLATEST CUSTOMER MESSAGE:\n${latest}\n\nReturn one 150-300 character reply.`
        });

        const data = await callNoTrack(env, messages);
        const reply = firstReplyOnly(data?.choices?.[0]?.message?.content || "");

        return json({ reply: reply || "I want to make sure I respond to what you actually said. What part of that matters most to you?" });
      } catch (error) {
        return json({ error: String(error.message || error) }, 500);
      }
    }

    if (url.pathname === "/save-learning" && request.method === "POST") {
      try {
        const body = await request.json();
        if (!env.LEARNING_KV) {
          return json({ ok: true, saved: false, reason: "LEARNING_KV is not configured" });
        }

        const examples = await getLearning(env);
        examples.push({
          incoming: clean(body.incoming || "").slice(0, 800),
          suggested: clean(body.suggested || "").slice(0, 420),
          final: clean(body.final || "").slice(0, 420),
          timestamp: new Date().toISOString()
        });

        if (examples.length > 1500) examples.splice(0, examples.length - 1500);
        await env.LEARNING_KV.put("learning_history", JSON.stringify(examples));
        return json({ ok: true, saved: true });
      } catch (error) {
        return json({ ok: false, error: String(error.message || error) }, 500);
      }
    }

    return json({ error: "Not found" }, 404);
  }
};
