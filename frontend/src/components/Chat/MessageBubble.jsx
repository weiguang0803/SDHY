import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import AgentProcess from './AgentProcess';
import MultimodalPanel from '../Multimodal/MultimodalPanel';
import SuggestedQuestions from './SuggestedQuestions';
import MessageActions from './MessageActions';
import { SparklesIcon } from '../Common/Icons';
import './MessageBubble.css';
import useChatStore from '../../stores/chatStore';

export default function MessageBubble({ message, isLast, isStreaming, agentEvents, userPrompt }) {
  const isUser = message.role === 'user';
  const user = useChatStore(state => state.user);
  
  const showAgentProcess = !isUser && isLast && (isStreaming || agentEvents?.length > 0);

  const formatMessageTime = (time) => {
    if (!time) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let str = String(time);
    if (!str.endsWith('Z') && !str.includes('+') && str.includes('T')) {
      str += 'Z';
    }
    const d = new Date(str);
    return isNaN(d.getTime()) 
      ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get multimodal items & suggested questions from message
  const multimodalItems = message.multimodal?.multimodal_items || [];
  const suggestedQuestions = message.multimodal?.suggested_questions || [];

  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'ai'} fade-in`}>
      {!isUser && (
        <div className="message-avatar ai-avatar">
          <SparklesIcon size={18} color="#ffffff" />
        </div>
      )}
      
      <div className="message-content-wrapper">
        <div className="message-header">
          <span className="message-name">{isUser ? (user?.display_name || user?.username || 'User') : '师道汉韵 AI'}</span>
          <span className="message-time">
            {formatMessageTime(message.created_at)}
          </span>
        </div>

        {showAgentProcess && (
          <AgentProcess agentEvents={agentEvents} isActive={isStreaming} />
        )}

        {(!isUser || message.content) && (
          <div className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
            {isUser ? (
              <div className="user-text">{message.content}</div>
            ) : (
              <div className="markdown-body">
                {message.content ? (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <div className="thinking-placeholder">
                    <span>智能体协同分析中...</span>
                  </div>
                )}
                {isLast && isStreaming && <span className="typing-cursor"></span>}
              </div>
            )}
          </div>
        )}

        {/* Multimodal Panel - render after message content */}
        {!isUser && (multimodalItems.length > 0 || (message.multimodal?.videos || []).length > 0) && (
          <MultimodalPanel 
            items={multimodalItems} 
            videos={message.multimodal?.videos || []}
          />
        )}

        {/* Suggested Follow-up Questions Chips */}
        {!isUser && suggestedQuestions.length > 0 && (
          <SuggestedQuestions questions={suggestedQuestions} />
        )}

        {/* Action Buttons: 重新生成、收藏、复制、删除 */}
        {!isUser && message.content && !(isLast && isStreaming) && (
          <MessageActions 
            message={message} 
            isStreaming={isStreaming} 
            userPrompt={userPrompt} 
          />
        )}
      </div>

      {isUser && (
        <div className="message-avatar user-avatar-msg">
          {user?.display_name ? user.display_name[0].toUpperCase() : 'U'}
        </div>
      )}
    </div>
  );
}
