import { useCallback } from 'react';
import useChatStore from '../stores/chatStore';

export const useSSE = () => {
  const token = useChatStore(state => state.token);
  const setStreaming = useChatStore(state => state.setStreaming);
  const addAgentEvent = useChatStore(state => state.addAgentEvent);
  const appendToken = useChatStore(state => state.appendToken);
  const addUserMessage = useChatStore(state => state.addUserMessage);
  const addAssistantMessage = useChatStore(state => state.addAssistantMessage);
  const clearAgentEvents = useChatStore(state => state.clearAgentEvents);
  const setMultimodalData = useChatStore(state => state.setMultimodalData);
  const addMultimodalToLastMessage = useChatStore(state => state.addMultimodalToLastMessage);

  const sendMessage = useCallback(async (conversationId, messageText, options = {}) => {
    const { regenerate = false, messageId = null } = options;
    if (regenerate) {
      useChatStore.setState(state => {
        const msgs = [...state.messages];
        if (messageId) {
          return {
            messages: msgs.map(m => m.id === messageId ? { ...m, content: '', multimodal: null } : m)
          };
        } else {
          const lastIdx = msgs.length - 1;
          if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
            msgs[lastIdx] = { ...msgs[lastIdx], content: '', multimodal: null };
          }
          return { messages: msgs };
        }
      });
    } else {
      addUserMessage(messageText);
      addAssistantMessage(''); // Add draft assistant message for immediate AgentProcess & response rendering
    }
    clearAgentEvents();
    setStreaming(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ 
          conversation_id: conversationId, 
          message: messageText,
          regenerate,
          message_id: messageId
        })
      });

      if (!response.ok) throw new Error('Stream request failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let currentEvent = 'message';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.slice(6).trim();
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]' || currentEvent === 'done') {
              // Micro-delay to ensure multimodal state update settles before streaming ends
              setTimeout(async () => {
                setStreaming(false);
                if (conversationId) {
                  try {
                    await useChatStore.getState().loadMessages(conversationId);
                  } catch (e) {
                    // ignore
                  }
                }
              }, 60);
              return;
            }

            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'token') {
                appendToken(data.content || data.token || '');
              } else if (currentEvent === 'multimodal') {
                setMultimodalData(data);
                addMultimodalToLastMessage(data); // Immediately attach to draft message UI
              } else if (['agent_start', 'agent_thinking', 'agent_complete'].includes(currentEvent)) {
                addAgentEvent({ type: currentEvent, payload: data });
              } else if (currentEvent === 'error') {
                console.error('SSE Error:', data);
                setStreaming(false);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e, dataStr);
            }
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err);
    } finally {
      setTimeout(() => {
        setStreaming(false);
      }, 50);
    }
  }, [token, setStreaming, addAgentEvent, appendToken, addUserMessage, addAssistantMessage, clearAgentEvents, setMultimodalData, addMultimodalToLastMessage]);

  return { sendMessage };
};
