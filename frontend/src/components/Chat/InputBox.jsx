import { useState, useRef, useEffect } from 'react';
import useChatStore from '../../stores/chatStore';
import { useSSE } from '../../hooks/useSSE';
import { EditIcon, ChatIcon, TargetIcon, BookIcon } from '../Common/Icons';
import './InputBox.css';

export default function InputBox() {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  
  const currentConversationId = useChatStore(state => state.currentConversationId);
  const isStreaming = useChatStore(state => state.isStreaming);
  const createConversation = useChatStore(state => state.createConversation);
  const { sendMessage } = useSSE();

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  const handleSend = async () => {
    if (!text.trim() || isStreaming) return;
    const msgText = text.trim();
    setText('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    let convId = currentConversationId;
    if (!convId) {
      const newConv = await createConversation(msgText.slice(0, 20));
      convId = newConv.id;
    }

    sendMessage(convId, msgText);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTagClick = (tagText) => {
    setText(tagText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="input-box-container">
      <div className="input-box-wrapper glass-panel">
        <textarea
          ref={textareaRef}
          className="chat-input custom-scrollbar"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="发送消息，开启中文学习之旅..."
          disabled={isStreaming}
          rows={1}
        />

        <div className="input-actions-bar">
          <div className="quick-tags">
            <button type="button" className="tag-btn" onClick={() => handleTagClick('语法纠错：')}>
              <EditIcon size={14} color="#6c63ff" />
              <span>语法纠错</span>
            </button>
            <button type="button" className="tag-btn" onClick={() => handleTagClick('日常对话练习：')}>
              <ChatIcon size={14} color="#3b82f6" />
              <span>自由对话</span>
            </button>
            <button type="button" className="tag-btn" onClick={() => handleTagClick('HSK阅读练习：')}>
              <TargetIcon size={14} color="#ec4899" />
              <span>HSK练习</span>
            </button>
            <button type="button" className="tag-btn" onClick={() => handleTagClick('推荐中文资源：')}>
              <BookIcon size={14} color="#f59e0b" />
              <span>资源推荐</span>
            </button>
          </div>

          <button 
            type="button"
            className="send-button"
            onClick={handleSend}
            disabled={!text.trim() || isStreaming}
            title="发送消息"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="input-footer">
        按 Enter 发送，Shift + Enter 换行 ｜ 师道汉韵 多智能体协同教学
      </div>
    </div>
  );
}
