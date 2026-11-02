import React from 'react'
import ModulePlaceholder from '../Common/ModulePlaceholder'
import { ObservabilityIcon } from '../Common/AdminIcons'

const AgentObservability = () => {
  return (
    <ModulePlaceholder
      icon={<ObservabilityIcon size={30} />}
      title="智能体观测中心"
      englishTitle="Multi-Agent Workflow & Observability Center"
      phaseTag="Phase 2 · 首期提前"
      statusText="底表时间戳与事件已验证"
      problemStatement="8 大智能体如何协同？每一步耗时多久？质检节点是否生效？"
      description="全面公开师道汉韵 8 大智能体 LangGraph 编排执行流水线。以高保真 SVG 拓扑网络、阶段耗时瀑布图与单次执行逐步回放，揭秘大模型多智能体教学底座。"
      featureCards={[
        {
          tag: "流水线拓扑",
          title: "8 大智能体 LangGraph 工作流拓扑图",
          desc: "Intent → Memory → Knowledge → Profile → Orchestrator → Teaching → Multimodal → Validator，支持重试回边点亮。",
          metrics: ["8 节点拓扑", "动态点亮", "重试回边", "SVG 渲染"]
        },
        {
          tag: "阶段耗时",
          title: "多智能体耗时横向瀑布图 (Waterfall)",
          desc: "基于 messages.agent_process 中的精确 ISO 起止时间戳，毫秒级计算各 Agent 运行开销，排查慢节点与吞吐瓶颈。",
          metrics: ["ISO 时间戳", "毫秒耗时", "横向瀑布", "性能排查"]
        },
        {
          tag: "执行回放",
          title: "历史教学单次执行点亮回放与学术质检",
          desc: "任选真实回复逐步重演智能体思考链，透视分层记忆（L1/L2/L3）装配状态与 Validator 五维学术质量得分卡。",
          metrics: ["思考链回放", "分层记忆", "质检打分", "状态透视"]
        }
      ]}
    />
  )
}

export default AgentObservability
