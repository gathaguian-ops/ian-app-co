function getAIResponse(userMessage) {
  // Dummy AI response
  const response = `AI: I received "${userMessage}"`;
  messages.push({ user: 'AI', text: response });
  renderMessages();
}
