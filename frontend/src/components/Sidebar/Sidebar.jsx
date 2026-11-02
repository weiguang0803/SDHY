import { useState } from 'react';
import useChatStore from '../../stores/chatStore';
import { ChatIcon, PlusIcon, TrashIcon, LogoutIcon, SparklesIcon, SidebarIcon, StarIcon } from '../Common/Icons';
import ThemeToggle from '../Common/ThemeToggle';
import './Sidebar.css';

export default function Sidebar() {
  const { 
    user, 
    conversations, 
    currentConversationId, 
    createConversation, 
    selectConversation, 
    deleteConversation, 
    toggleConversationFavorite,
    sidebarTab,
    setSidebarTab,
    logout,
    sidebarCollapsed,
    toggleSidebar
  } = useChatStore();

  const handleNewChat = async () => {
    await createConversation('新对话');
  };

  const groupConversations = () => {
    const today = [];
    const yesterday = [];
    const last7Days = [];
    const older = [];
    
    const now = new Date();
    
    conversations.forEach(conv => {
      const convDate = new Date(conv.created_at || Date.now());
      const diffTime = Math.abs(now - convDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        today.push(conv);
      } else if (diffDays === 2) {
        yesterday.push(conv);
      } else if (diffDays <= 7) {
        last7Days.push(conv);
      } else {
        older.push(conv);
      }
    });

    return { today, yesterday, last7Days, older };
  };

  const groups = groupConversations();

  const favoriteConvs = conversations.filter(c => Boolean(c.is_favorite));

  const renderConvItem = (conv) => {
    const isActive = currentConversationId === conv.id;
    const isFav = Boolean(conv.is_favorite);

    return (
      <div 
        key={conv.id} 
        className={`conv-item ${isActive ? 'active' : ''} ${isFav ? 'has-favorite' : ''}`}
        onClick={() => selectConversation(conv.id)}
      >
        <span className="conv-icon">
          <ChatIcon size={16} color={isActive ? "var(--primary)" : isFav ? "#f59e0b" : "var(--text-muted)"} />
        </span>
        <span className="conv-title" title={conv.title}>
          {conv.title || '新对话'}
        </span>

        <div className="conv-actions-hover">
          <button 
            className={`conv-action-btn conv-fav-btn ${isFav ? 'favorited' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleConversationFavorite(conv.id);
            }}
            title={isFav ? "取消收藏" : "收藏该对话"}
          >
            <StarIcon size={13} fill={isFav ? "#f59e0b" : "none"} color={isFav ? "#f59e0b" : "currentColor"} />
          </button>
          <button 
            className="conv-action-btn conv-delete-btn" 
            onClick={(e) => {
              e.stopPropagation();
              deleteConversation(conv.id);
            }}
            title="删除对话"
          >
            <TrashIcon size={13} />
          </button>
        </div>
      </div>
    );
  };

  const renderGroup = (title, convs) => {
    if (convs.length === 0) return null;
    return (
      <div className="conv-group">
        <div className="conv-group-title">{title}</div>
        {convs.map(conv => renderConvItem(conv))}
      </div>
    );
  };

  return (
    <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} glass-panel`}>
      <div className="sidebar-header">
        <div className="logo-row">
          <h2 className="app-logo">
            <SparklesIcon size={20} color="var(--primary)" className="logo-sparkle" />
            <span>师道汉韵</span>
          </h2>
          <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="收起侧边栏">
            <SidebarIcon size={18} color="var(--text-muted)" />
          </button>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>
          <PlusIcon size={16} />
          <span>新建对话</span>
        </button>

        {/* 区域标签切换：全部对话 vs 收藏对话 */}
        <div className="sidebar-tabs">
          <button 
            className={`sidebar-tab-btn ${sidebarTab === 'all' ? 'active' : ''}`}
            onClick={() => setSidebarTab('all')}
          >
            <ChatIcon size={13} />
            <span>全部</span>
            <span className="tab-badge">{conversations.length}</span>
          </button>
          <button 
            className={`sidebar-tab-btn ${sidebarTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setSidebarTab('favorites')}
          >
            <StarIcon 
              size={13} 
              fill={favoriteConvs.length > 0 ? "#f59e0b" : "none"} 
              color={favoriteConvs.length > 0 ? "#f59e0b" : "currentColor"} 
            />
            <span>收藏对话</span>
            {favoriteConvs.length > 0 && (
              <span className="tab-badge fav-badge">{favoriteConvs.length}</span>
            )}
          </button>
        </div>
      </div>

      <div className="conversations-list custom-scrollbar">
        {sidebarTab === 'favorites' ? (
          favoriteConvs.length === 0 ? (
            <div className="sidebar-empty-fav fade-in">
              <div className="empty-fav-icon-box">
                <StarIcon size={26} color="#f59e0b" fill="rgba(245, 158, 11, 0.2)" />
              </div>
              <p className="empty-fav-title">暂无收藏对话</p>
              <p className="empty-fav-desc">点击对话卡片下方的【收藏】按钮，即可将重要的教学对话沉淀在此</p>
            </div>
          ) : (
            <div className="conv-group fade-in">
              <div className="conv-group-title">⭐ 收藏对话列表 ({favoriteConvs.length})</div>
              {favoriteConvs.map(conv => renderConvItem(conv))}
            </div>
          )
        ) : (
          <>
            {renderGroup('今天', groups.today)}
            {renderGroup('昨天', groups.yesterday)}
            {renderGroup('最近7天', groups.last7Days)}
            {renderGroup('更早', groups.older)}
          </>
        )}
      </div>

      <div className="sidebar-footer">
        {user && (
          <div className="user-card">
            <div className="user-avatar">
              {user.display_name ? user.display_name[0].toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{user.display_name || user.username}</div>
              <div className="user-badge">{user.chinese_level || '初学者'}</div>
            </div>
            <div className="user-actions-row">
              <ThemeToggle />
              <button className="logout-btn" onClick={logout} title="退出登录">
                <LogoutIcon size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
