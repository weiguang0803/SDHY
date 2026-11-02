import { useState, useEffect } from 'react';
import useChatStore from '../../stores/chatStore';
import { 
  BrainIcon, 
  TargetIcon, 
  MemoryIcon, 
  ProfileIcon, 
  OrchestratorIcon, 
  TeachingIcon, 
  MultimodalIcon,
  ShieldCheckIcon,
  CheckIcon,
  BookIcon 
} from '../Common/Icons';
import { 
  I18N_PACKS, 
  resolveAgentLang, 
  formatAgentResult 
} from './agentProcessI18n';
import './AgentProcess.css';

const AGENT_CONFIG = [
  { id: 'intent_agent', name: '意图识别', Icon: TargetIcon, color: '#6c63ff', desc: '分析用户意图与语言' },
  { id: 'memory_agent', name: '分层记忆', Icon: MemoryIcon, color: '#3b82f6', desc: '检索短期/情景/持久记忆' },
  { id: 'knowledge_agent', name: '知识检索', Icon: BookIcon, color: '#0ea5e9', desc: '匹配官方知识库与教具' },
  { id: 'profile_agent', name: '画像匹配', Icon: ProfileIcon, color: '#8b5cf6', desc: '匹配用户学习画像' },
  { id: 'orchestrator_agent', name: '教学策略', Icon: OrchestratorIcon, color: '#ec4899', desc: '制定个性化教学方案' },
  { id: 'teaching_agent', name: '生成回复', Icon: TeachingIcon, color: '#f59e0b', desc: '生成教学内容与规范例句' },
  { id: 'multimodal_agent', name: '多模态直出', Icon: MultimodalIcon, color: '#14b8a6', desc: '直出简笔画/微课/笔顺教具' },
  { id: 'validator_agent', name: '质量验证', Icon: ShieldCheckIcon, color: '#22c55e', desc: '五维质量与小语种校验' }
];

export default function AgentProcess({ agentEvents = [], isActive = false }) {
  const [expanded, setExpanded] = useState(isActive);
  const user = useChatStore((state) => state.user);

  // 全自动自适应：自动检测当前学习者的母语认知画像，若未设定或非支持语种则 100% 保底为通用英语 (en)
  const activeLangCode = resolveAgentLang(user?.native_language);
  const i18n = I18N_PACKS[activeLangCode] || I18N_PACKS.en;

  useEffect(() => {
    if (isActive) {
      setExpanded(true);
    } else if (agentEvents.length > 0) {
      // 过程与文本流式生成完成后，自动优雅折叠收纳
      const timer = setTimeout(() => {
        setExpanded(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive, agentEvents.length]);

  const getAgentStatus = (agentId) => {
    const eventsForAgent = agentEvents.filter(e => e.payload && e.payload.agent === agentId);
    if (eventsForAgent.length === 0) return 'waiting';
    
    const lastEvent = eventsForAgent[eventsForAgent.length - 1];
    if (lastEvent.type === 'agent_complete') return 'done';
    return 'running';
  };

  const getAgentResult = (agentId) => {
    const completeEvent = agentEvents.find(e => e.payload && e.payload.agent === agentId && e.type === 'agent_complete');
    return completeEvent?.payload?.result || completeEvent?.payload?.message || '';
  };

  // 找到已完成的最大索引
  let lastDoneIndex = -1;
  AGENT_CONFIG.forEach((agent, i) => {
    if (getAgentStatus(agent.id) === 'done') {
      lastDoneIndex = i;
    }
  });

  // 动态计算渲染列表中包含的智能体数量
  // 运行中：包含所有已完成智能体 + 1个正在占位推演的智能体
  let visibleCount = 0;
  if (isActive) {
    visibleCount = Math.min(AGENT_CONFIG.length, lastDoneIndex + 2);
  } else {
    visibleCount = lastDoneIndex + 1;
  }

  if (isActive && visibleCount === 0) {
    visibleCount = 1;
  }

  if (!isActive && agentEvents.length === 0) return null;

  const visibleAgents = AGENT_CONFIG.slice(0, visibleCount);

  return (
    <div className={`agent-process-container ${expanded ? 'expanded' : 'collapsed'} fade-in`}>
      <div 
        className="agent-process-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="header-icon">
          <BrainIcon size={20} color="var(--primary)" />
        </span>
        <span className="header-title">{i18n.headerTitle}</span>

        <span className="header-status">
          {isActive ? <span className="status-pulse"></span> : null}
          {isActive ? i18n.statusRunning : i18n.statusDone}
        </span>
        <span className="header-toggle">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="agent-timeline">
          {visibleAgents.map((agent, index) => {
            const rawStatus = getAgentStatus(agent.id);
            // 若该智能体尚未返回 complete 事件，则处于 running 运行中占位状态
            const status = rawStatus === 'done' ? 'done' : 'running';
            const result = status === 'done' ? getAgentResult(agent.id) : '';
            const isLastItem = index === visibleAgents.length - 1;
            const AgentSvgIcon = agent.Icon;

            const localizedAgent = i18n.agents[agent.id] || {};
            const agentName = localizedAgent.name || agent.name;
            const agentDesc = localizedAgent.desc || agent.desc;

            return (
              <div key={agent.id} className={`timeline-item ${status} slide-in-up`}>
                <div className="timeline-connector">
                  <div 
                    className="timeline-dot"
                    style={{ backgroundColor: agent.color }}
                  ></div>
                  {!isLastItem && <div className="timeline-line"></div>}
                </div>
                
                <div className="timeline-content">
                  <div className="timeline-content-header">
                    <span className="agent-icon">
                      <AgentSvgIcon size={18} color={agent.color} />
                    </span>
                    <span className="agent-name" style={{ color: agent.color }}>
                      {agentName}
                    </span>
                    {status === 'running' && <span className="agent-spinner"></span>}
                    {status === 'done' && (
                      <span className="agent-check">
                        <CheckIcon size={15} color="#22c55e" />
                      </span>
                    )}
                  </div>
                  
                  <div className="agent-desc">
                    {status === 'running' 
                      ? `${agentDesc}${i18n.runningSuffix}` 
                      : agentDesc}
                  </div>
                  
                  {result && (
                    <div className="agent-result slide-in-up">
                      {formatAgentResult(result, activeLangCode)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

