let username = '';
const apiKey = "sk-REPLACE_WITH_YOUR_OPENAI_KEY"; // Replace with your real key

function login() {
  const input = document.getElementById('username');
  if (input.value.trim() === '') {
    alert('Enter your name');
    return;
  }

  username = input.value.trim();
  document.getElementById('userDisplay').textContent = username;
  document.getElementById('login').style.display = 'none';
  document.getElementById('chat').style.display = 'block';
}

function logout() {
  username = '';
  document.getElementById('chat').style.display = 'none';
  document.getElementById('login').style.display = 'block';
}

function renderMessage(user, text, mediaUrl = null) {
  const container = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `message ${user === 'AI' ? 'ai' : 'user'}`;
  div.innerHTML = `<b>${user}:</b> ${text || ''}`;

  if (mediaUrl) {
    if (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm')) {
      div.innerHTML += `<br><video controls src="${mediaUrl}"></video>`;
    } else {
      div.innerHTML += `<br><img src="${mediaUrl}" alt="uploaded media" />`;
    }
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
  const textInput = document.getElementById('messageInput');
  const fileInput = document.getElementById('fileInput');
  const text = textInput.value.trim();
  const file = fileInput.files[0];

  // if both are empty, do nothing
  if (!text && !file) return;

  let mediaUrl = null;

  if (file) {
    mediaUrl = URL.createObjectURL(file);
  }

  // render user message
  renderMessage(username, text, mediaUrl);

  // clear inputs
  textInput.value = '';
  fileInput.value = '';

  // if there is text, trigger AI response
  if (text) await getAIResponse(text);
}

async function getAIResponse(message) {
  renderMessage('AI', 'Typing...');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are Imptech Assistant, a helpful chat companion.' },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await res.json();
    const aiReply = data.choices?.[0]?.message?.content || 'Error: No response from AI.';
    renderMessage('AI', aiReply);
  } catch (e) {
    renderMessage('AI', '⚠️ Error: Unable to reach OpenAI API.');
  }
}
