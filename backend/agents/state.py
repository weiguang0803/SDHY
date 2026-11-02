from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    user_input: str
    user_id: str
    conversation_id: str
    intent: Dict[str, Any]
    # 分层记忆体系
    short_term_memory: List[Dict[str, Any]]    # L1: 短期工作记忆（无损滑动窗口）
    episodic_memory: Dict[str, Any]             # L2: 情景动态记忆（阶段性摘要、历史学习脉络）
    profile_memory: Dict[str, Any]              # L3: 长期持久画像（薄弱点、掌握度、雷达等）
    long_term_memory: List[Dict[str, Any]]     # 历史记录兼容
    # 教学知识库体系
    knowledge_context: Dict[str, Any]           # 知识库命中结果（文本/例句/本地简笔画/本地短视频）
    user_profile: Dict[str, Any]               # 用户基础档案
    teaching_strategy: Dict[str, Any]          # 教学策略
    teaching_response: str                     # 教学内容
    multimodal_data: Dict[str, Any]            # 多模态教具资源
    validation_result: Dict[str, Any]          # 五维验证结果
    retry_count: int
    agent_events: List[Dict[str, Any]]
