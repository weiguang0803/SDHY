import { useEffect, useRef } from 'react';
import useChatStore from '../../stores/chatStore';
import MessageBubble from './MessageBubble';
import InputBox from './InputBox';
import { useSSE } from '../../hooks/useSSE';
import { EditIcon, BookIcon, TargetIcon, ChatIcon, SparklesIcon, SidebarIcon } from '../Common/Icons';
import './ChatArea.css';

export default function ChatArea() {
  const { currentConversationId, messages, agentEvents, isStreaming, createConversation, sidebarCollapsed, toggleSidebar } = useChatStore();
  const { sendMessage } = useSSE();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, agentEvents]);

  const handleQuickStart = async (text) => {
    let convId = currentConversationId;
    if (!convId) {
      const newConv = await createConversation(text.slice(0, 20));
      convId = newConv.id;
    }
    sendMessage(convId, text);
  };

  const quickStarts = [
    { 
      title: 'HSK 专项模考',
      tag: 'HSK 4级',
      desc: '练习 HSK4 级阅读理解与核心生词',
      prompt: '请帮我练习 HSK4 级的阅读理解与生词', 
      icon: TargetIcon, 
      color: '#ec4899',
      glow: 'rgba(236, 72, 153, 0.18)'
    },
    { 
      title: '语法偏误纠错',
      tag: '病句诊断',
      desc: '“我昨天去了学校在，对吗？” 帮我分析语序',
      prompt: '语法纠错：我昨天去了学校在，对吗？', 
      icon: EditIcon, 
      color: '#8b5cf6',
      glow: 'rgba(139, 92, 246, 0.18)'
    },
    { 
      title: '分级阅读推荐',
      tag: '微课资源',
      desc: '推荐适合初中级中文学习者的精选阅读资源',
      prompt: '推荐适合初中级学习者的中文阅读资源', 
      icon: BookIcon, 
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.18)'
    },
    { 
      title: '情境会话陪练',
      tag: '日常口语',
      desc: '用中文和我进行日常生活场景对话与角色练习',
      prompt: '用中文和我进行日常生活场景对话练习', 
      icon: ChatIcon, 
      color: '#3b82f6',
      glow: 'rgba(59, 130, 246, 0.18)'
    }
  ];

  const showWelcome = !currentConversationId && messages.length === 0;

  return (
    <div className="chat-area">
      {/* Floating expand sidebar button when collapsed */}
      {sidebarCollapsed && (
        <button 
          className="floating-sidebar-btn glass-panel fade-in" 
          onClick={toggleSidebar}
          title="展开侧边栏"
        >
          <SidebarIcon size={20} color="var(--text-primary)" />
        </button>
      )}

      {showWelcome ? (
        <div className="welcome-screen fade-in">
          <div className="welcome-logo">
            <SparklesIcon size={32} color="#ffffff" />
          </div>
          <h1 className="welcome-title">师道汉韵</h1>
          <p className="welcome-desc">多智能体协同 · 国际中文教育智能教学平台</p>
          
          <div className="quick-starts-grid">
            {quickStarts.map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <div 
                  key={i} 
                  className="quick-start-card glass-panel slide-in-up" 
                  style={{ animationDelay: `${i * 0.08}s` }}
                  onClick={() => handleQuickStart(item.prompt)}
                >
                  <div className="card-top-row">
                    <span 
                      className="card-icon" 
                      style={{ 
                        backgroundColor: item.glow, 
                        color: item.color,
                        boxShadow: `0 4px 12px ${item.glow}`
                      }}
                    >
                      <ItemIcon size={18} color={item.color} />
                    </span>
                    <div className="card-tag-wrapper">
                      <span 
                        className="card-tag" 
                        style={{ 
                          color: item.color, 
                          borderColor: `${item.color}35`, 
                          backgroundColor: `${item.color}12` 
                        }}
                      >
                        {item.tag}
                      </span>
                      <span className="card-arrow">↗</span>
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="card-title">{item.title}</div>
                    <div className="card-desc" title={item.desc}>{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="messages-container custom-scrollbar">
          {messages.length === 0 && !isStreaming ? (
            <div className="empty-messages fade-in">
              <p>发送消息，开启师道汉韵多智能体协同教学...</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg, idx) => {
                let prevUserPrompt = '';
                for (let i = idx - 1; i >= 0; i--) {
                  if (messages[i].role === 'user') {
                    prevUserPrompt = messages[i].content;
                    break;
                  }
                }
                return (
                  <MessageBubble 
                    key={msg.id || idx} 
                    message={msg} 
                    userPrompt={prevUserPrompt}
                    isLast={idx === messages.length - 1}
                    isStreaming={isStreaming}
                    agentEvents={idx === messages.length - 1 ? agentEvents : []}
                  />
                );
              })}
              <div ref={messagesEndRef} className="messages-anchor" />
            </div>
          )}
        </div>
      )}
      
      <InputBox />
    </div>
  );
}
