import React, { useState } from 'react';
import useChatStore from '../../stores/chatStore';
import { useSSE } from '../../hooks/useSSE';
import { 
  RefreshIcon, 
  StarIcon, 
  CopyIcon, 
  CheckIcon, 
  TrashIcon 
} from '../Common/Icons';
import './MessageActions.css';

export default function MessageActions({ message, isStreaming, userPrompt }) {
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [favToast, setFavToast] = useState('');

  const currentConversationId = useChatStore(state => state.currentConversationId);
  const toggleMessageFavorite = useChatStore(state => state.toggleMessageFavorite);
  const deleteMessage = useChatStore(state => state.deleteMessage);
  const { sendMessage } = useSSE();

  const isFavorite = Boolean(message?.is_favorite);

  // 1. 复制操作
  const handleCopy = async () => {
    if (!message?.content) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(message.content);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = message.content;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // 2. 收藏操作
  const handleToggleFavorite = async () => {
    if (!message?.id) return;
    await toggleMessageFavorite(message.id);
    const nextState = !isFavorite;
    setFavToast(nextState ? '已加入收藏' : '已取消收藏');
    setTimeout(() => setFavToast(''), 1800);
  };

  // 3. 重新生成操作
  const handleRegenerate = () => {
    if (isStreaming || !currentConversationId) return;
    const promptToUse = userPrompt || '请继续优化并重新回答上述内容';
    sendMessage(currentConversationId, promptToUse, {
      regenerate: true,
      messageId: message.id
    });
  };

  // 4. 删除操作
  const handleDelete = async () => {
    if (!message?.id) return;
    await deleteMessage(message.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="message-actions-container fade-in">
      <div className="message-actions-bar">
        {/* 重新生成按钮 */}
        <button 
          className="action-btn regenerate-btn" 
          onClick={handleRegenerate}
          disabled={isStreaming}
          title="重新生成此回答"
        >
          <RefreshIcon size={14} />
          <span className="action-text">重新生成</span>
        </button>

        {/* 收藏按钮 */}
        <button 
          className={`action-btn favorite-btn ${isFavorite ? 'favorited' : ''}`} 
          onClick={handleToggleFavorite}
          title={isFavorite ? "取消收藏" : "收藏该回答"}
        >
          <StarIcon 
            size={14} 
            color={isFavorite ? "#f59e0b" : "currentColor"} 
            fill={isFavorite ? "#f59e0b" : "none"} 
            className={isFavorite ? "star-pulse" : ""}
          />
          <span className="action-text">{isFavorite ? '已收藏' : '收藏'}</span>
        </button>

        {/* 复制按钮 */}
        <button 
          className={`action-btn copy-btn ${copied ? 'copied' : ''}`} 
          onClick={handleCopy}
          title={copied ? "已复制到剪贴板" : "复制回答内容"}
        >
          {copied ? <CheckIcon size={14} color="#10b981" /> : <CopyIcon size={14} />}
          <span className="action-text">{copied ? '已复制' : '复制'}</span>
        </button>

        {/* 删除按钮 */}
        {showDeleteConfirm ? (
          <div className="delete-confirm-group">
            <span className="confirm-tip">确定删除?</span>
            <button className="confirm-btn confirm-yes" onClick={handleDelete} title="确认删除">确定</button>
            <button className="confirm-btn confirm-no" onClick={() => setShowDeleteConfirm(false)} title="取消">取消</button>
          </div>
        ) : (
          <button 
            className="action-btn delete-btn" 
            onClick={() => setShowDeleteConfirm(true)}
            title="删除此条回答"
          >
            <TrashIcon size={14} />
            <span className="action-text">删除</span>
          </button>
        )}
      </div>

      {/* 收藏操作微提示 */}
      {favToast && (
        <div className="fav-toast-bubble slide-in-up">
          <StarIcon size={12} fill="#f59e0b" color="#f59e0b" />
          <span>{favToast}</span>
        </div>
      )}
    </div>
  );
}
