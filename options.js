const api = document.getElementById("api");
const status = document.getElementById("status");

chrome.storage.local.get(["apiBaseUrl"]).then(({ apiBaseUrl }) => {
  api.value = apiBaseUrl || "";
});

document.getElementById("save").addEventListener("click", async () => {
  const apiBaseUrl = api.value.trim().replace(/\/+$/, "");
  await chrome.storage.local.set({ apiBaseUrl });
  status.textContent = "Saved.";
  setTimeout(() => status.textContent = "", 1600);
});
