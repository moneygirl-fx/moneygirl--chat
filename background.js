// background.js
console.log("Money Girl Chat background active");

const CONFIG_URL = "https://raw.githubusercontent.com/moneygirl-fx/moneygirl--chat/money-girl/config.json";
let configCache = { url: "", loadedAt: 0 };
const CONFIG_CACHE_MS = 60 * 1000;

async function getApiBaseUrl() {
  const local = await chrome.storage.local.get(["apiBaseUrl"]);
  if (local.apiBaseUrl) return String(local.apiBaseUrl).replace(/\/+$/, "");

  if (configCache.url && (Date.now() - configCache.loadedAt) < CONFIG_CACHE_MS) {
    return configCache.url;
  }

  try {
    const response = await fetch(CONFIG_URL, { cache: "no-store" });
    if (response.ok) {
      const config = await response.json();
      const url = String(config.apiBaseUrl || "").trim().replace(/\/+$/, "");
      if (url) {
        configCache = { url, loadedAt: Date.now() };
        return url;
      }
    }
  } catch (error) {
    console.warn("Could not load remote config:", error);
  }

  return "http://localhost:3001";
}

async function postToApi(path, payload) {
  const baseUrl = await getApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.reply || `HTTP ${response.status}`);
  }
  return data;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GENERATE_REPLY") {
    const conversationString = Array.isArray(request.agentHistory)
      ? request.agentHistory.join("\n")
      : (request.agentHistory || "");

    postToApi("/suggest-reply", {
      conversation: conversationString,
      latestCustomerMessage: request.incomingMessage,
      myStyle: request.myStyle || []
    })
      .then(data => sendResponse(data))
      .catch(error => {
        console.error("Reply API error:", error);
        sendResponse({ reply: "... (Cloud server unavailable)" });
      });

    return true;
  }

  if (request.type === "SAVE_LEARNING") {
    postToApi("/save-learning", request.payload || {})
      .then(data => sendResponse(data))
      .catch(error => {
        console.error("Learning API error:", error);
        sendResponse({ ok: false });
      });

    return true;
  }

  if (request.type === "SET_API_BASE_URL") {
    const apiBaseUrl = String(request.apiBaseUrl || "").trim().replace(/\/+$/, "");
    chrome.storage.local.set({ apiBaseUrl }).then(() => {
      configCache = { url: "", loadedAt: 0 };
      sendResponse({ ok: true });
    });
    return true;
  }
});
