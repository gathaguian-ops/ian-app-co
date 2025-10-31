/* Imptech Consolidated — app.js
   Simple client-only messenger with:
   - localStorage persistence
   - media (images/videos) stored as data URLs in localStorage
   - OpenAI integration via direct fetch (user supplies key at runtime)
*/

const LS_KEY = "imptech_chat_v1";
const LS_KEY_API = "imptech_openai_key";
let state = { username: null, messages: [] };

const el = id => document.getElementById(id);

// Load existing state from localStorage
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) state = JSON.parse(raw);
  } catch (e) { console.error("loadState:", e) }
}

// Save state
function saveState() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

// Utility to append message object and render
function addMessage(msg) {
  state.messages.push(msg);
  saveState();
  renderMessages();
}

// Render messages to DOM
function renderMessages() {
  const container = el("messages");
  container.innerHTML = "";
  state.messages.forEach(m => {
    const div = document.createElement("div");
    div.className = "msg " + (m.user === state.username ? "me" : (m.user === "AI" ? "ai" : "other"));
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${m.user} • ${new Date(m.ts).toLocaleString()}`;
    div.appendChild(meta);

    const text = document.createElement("div");
    text.className = "text";
    text.textContent = m.text || "";
    div.appendChild(text);

    // media rendering
    if (m.media) {
      if (m.media.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = m.media.data;
        img.alt = m.media.name || "image";
        div.appendChild(img);
      } else if (m.media.type.startsWith("video/")) {
        const vid = document.createElement("video");
        vid.src = m.media.data;
        vid.controls = true;
        div.appendChild(vid);
      } else {
        const link = document.createElement("a");
        link.href = m.media.data;
        link.textContent = m.media.name || "download";
        link.download = m.media.name || "file";
        div.appendChild(link);
      }
    }

    container.appendChild(div);
  });

  // scroll to bottom
  container.scrollTop = container.scrollHeight;
}

// Join chat
function joinChat() {
  const name = el("usernameInput").value.trim();
  if (!name) return alert("Enter a display name");
  state.username = name;
  if (!state.messages) state.messages = [];
  saveState();
  el("displayName").textContent = state.username;
  el("loginView").style.display = "none";
  el("chatView").style.display = "block";
  renderMessages();
}

// Logout
function logout() {
  state.username = null;
  saveState();
  el("loginView").style.display = "block";
  el("chatView").style.display = "none";
}

// Send message + optional file
async function sendMessage() {
  const input = el("textInput");
  const fileInput = el("fileInput");
  const text = input.value.trim();
  const file = fileInput.files && fileInput.files[0];

  if (!text && !file) return;

  let media = null;
  if (file) {
    media = await fileToData(file);
  }

  const msg = { user: state.username, text: text || "", ts: Date.now(), media };
  addMessage(msg);

  input.value = "";
  fileInput.value = "";

  // ask AI to respond (non-blocking)
  aiRespond(msg);
}

// Convert file -> data URL and small object (keeps localStorage friendly)
function fileToData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// AI response: uses OpenAI Chat Completions (gpt-3.5-turbo). Requires API key stored in sessionStorage
async function aiRespond(userMsg) {
  const apiKey = sessionStorage.getItem(LS_KEY_API) || localStorage.getItem(LS_KEY_API);
  if (!apiKey) {
    // no key: add a gentle reply telling user to set key
    addMessage({ user: "AI", text: "AI is disabled — set your OpenAI key using 'Set OpenAI Key' in the top-right.", ts: Date.now() });
    return;
  }

  // Build prompt context using last messages (lightweight)
  const history = state.messages.slice(-8).map(m => ({ role: m.user === "AI" ? "assistant" : "user", content: (m.user === "AI" ? m.text : `${m.user}: ${m.text}`) }));
  // ensure user message included
  history.push({ role: "user", content: `${userMsg.user}: ${userMsg.text}` });

  // Show typing placeholder
  const typingId = `__typing_${Date.now()}`;
  addMessage({ user: "AI", text: "AI is thinking...", ts: Date.now(), metaId: typingId });

  try {
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant inside Imptech Consolidated chat. Keep replies short and friendly." },
        ...history
      ],
      max_tokens: 250,
      temperature: 0.7
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`OpenAI error: ${resp.status} ${errText}`);
    }

    const data = await resp.json();
    const aiText = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
      ? data.choices[0].message.content.trim()
      : "Sorry — I couldn't generate a response.";

    // Remove the typing placeholder (the last AI message)
    state.messages = state.messages.filter(m => m.metaId !== typingId);
    addMessage({ user: "AI", text: aiText, ts: Date.now() });

  } catch (err) {
    console.error("AI error", err);
    // replace typing placeholder with an error message
    state.messages = state.messages.filter(m => m.metaId !== typingId);
    addMessage({ user: "AI", text: `AI error: ${err.message}`, ts: Date.now() });
  }
}

// Modal key handlers
function showKeyModal() {
  el("modalKey").style.display = "flex";
  el("openaiKeyInput").value = localStorage.getItem(LS_KEY_API) || "";
}
function hideKeyModal() {
  el("modalKey").style.display = "none";
}
function saveKey() {
  const v = el("openaiKeyInput").value.trim();
  if (!v) {
    localStorage.removeItem(LS_KEY_API);
    sessionStorage.removeItem(LS_KEY_API);
  } else {
    // store in localStorage for persistence; you can change to sessionStorage if preferred
    localStorage.setItem(LS_KEY_API, v);
  }
  hideKeyModal();
  alert("OpenAI key saved locally in your browser (for testing). Do not share this device.");
}

// Clear chat (careful)
function clearChat() {
  if (!confirm("Clear all local chat messages? This will remove messages from your browser.")) return;
  state.messages = [];
  saveState();
  renderMessages();
}

// wire ui
function setup() {
  loadState();
  // show login if no username
  if (state.username) {
    el("displayName").textContent = state.username;
    el("loginView").style.display = "none";
    el("chatView").style.display = "block";
  }

  // events
  el("joinBtn").addEventListener("click", joinChat);
  el("sendBtn").addEventListener("click", sendMessage);
  el("aiBtn").addEventListener("click", () => {
    const text = el("textInput").value.trim();
    if (!text) return alert("Type a message to ask AI");
    // emulate sending a message then ask AI for more detailed answer
    const msg = { user: state.username, text, ts: Date.now() };
    addMessage(msg);
    el("textInput").value = "";
    aiRespond(msg);
  });
  el("btn-key").addEventListener("click", showKeyModal);
  el("closeKey").addEventListener("click", hideKeyModal);
  el("saveKey").addEventListener("click", saveKey);
  el("btn-clear").addEventListener("click", clearChat);

  // enter key in text box
  el("textInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  renderMessages();
}

document.addEventListener("DOMContentLoaded", setup);
