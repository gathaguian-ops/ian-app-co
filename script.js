let username = '';
let messages = [];

function login() {
  const input = document.getElementById('username');
  if(input.value.trim() === '') {
    alert('Enter a username');
    return;
  }
  username = input.value;
  document.getElementById('login').style.display = 'none';
  document.getElementById('chat').style.display = 'block';
  renderMessages();
}

function sendMessage() {
  const input = document.getElementById('messageInput');
  if(input.value.trim() === '') return;

  const message = {
    user: username,
    text: input.value
  };
  messages.push(message);
  input.value = '';
  renderMessages();

  // Call AI assistant for response
  getAIResponse(message.text);
}

function renderMessages() {
  const container = document.getElementById('messages');
  container.innerHTML = '';
  messages.forEach(msg => {
    const div = document.createElement('div');
    div.textContent = `${msg.user}: ${msg.text}`;
    container.appendChild(div);
  });
}
