const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("userInput");
const fileInput = document.getElementById("fileInput");

// ⚠️ Replace this with your actual OpenAI API key (keep it private)
const OPENAI_API_KEY = "sk-your_api_key_here";

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = userInput.value.trim();
  const file = fileInput.files[0];

  if (!userMessage && !file) return;

  // Show user message
  const userDiv = document.createElement("div");
  userDiv.classList.add("message", "user");
  userDiv.innerHTML = userMessage;
  chatBox.appendChild(userDiv);

  // If there’s a file, display it
  if (file) {
    const mediaDiv = document.createElement("div");
    mediaDiv.classList.add("message", "user");
    const mediaURL = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
      mediaDiv.innerHTML = `<img src="${mediaURL}" alt="Image" />`;
    } else if (file.type.startsWith("video/")) {
      mediaDiv.innerHTML = `<video controls src="${mediaURL}"></video>`;
    } else if (file.type.startsWith("audio/")) {
      mediaDiv.innerHTML = `<audio controls src="${mediaURL}"></audio>`;
    }

    chatBox.appendChild(mediaDiv);
  }

  userInput.value = "";
  fileInput.value = "";

  // Call OpenAI
  const aiDiv = document.createElement("div");
  aiDiv.classList.add("message", "ai");
  aiDiv.innerHTML = "Thinking...";
  chatBox.appendChild(aiDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userMessage || "Describe this media" }],
      }),
    });

    const data = await response.json();
    aiDiv.innerHTML = data.choices?.[0]?.message?.content || "AI didn’t respond properly.";
  } catch (error) {
    aiDiv.innerHTML = "⚠️ Error connecting to AI.";
  }

  chatBox.scrollTop = chatBox.scrollHeight;
});
