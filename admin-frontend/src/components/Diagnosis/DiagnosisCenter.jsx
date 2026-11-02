import React from 'react'
import ModulePlaceholder from '../Common/ModulePlaceholder'
import { DiagnosisIcon } from '../Common/AdminIcons'

const DiagnosisCenter = () => {
  return (
    <ModulePlaceholder
      icon={<DiagnosisIcon size={30} />}
      title="AI 学情研判中心"
      englishTitle="AI Learning Insights & Prescription Center"
      phaseTag="Phase 3 · 首期规划"
      statusText="L2+L3 双轮驱动架构就绪"
      problemStatement="这位学员的瓶颈是什么？怎么帮他？全校教学共性态势如何？"
      description="融合生成式大模型与 L2 跨会话情景动态摘要轨迹 + L3 终身认知画像，深度研判偏误成因与母语负迁移，生成带真实对话依据证据链的个性化研判白皮书与靶向教学处方。"
      featureCards={[
        {
          tag: "双轮驱动",
          title: "L2 动态轨迹 + L3 静态画像三栏报告",
          desc: "左侧客观证据链与五维雷达、中间 AI 认知阶段评定与偏误成因、右侧靶向教学处方与攻坚目标。",
          metrics: ["L2 演变史", "L3 雷达", "三栏架构", "动态回溯"]
        },
        {
          tag: "严肃研判",
          title: "客观证据链挂载 ([依据 →] 点击展开)",
          desc: "大模型生成结论必须严格挂载事实证据（关联真实 message_id），点击在右侧抽屉无缝展开原文，杜绝幻觉。",
          metrics: ["消息挂载", "无缝抽屉", "消除幻觉", "事实引用"]
        },
        {
          tag: "教学处方",
          title: "靶向处方推荐与 PDF 导出",
          desc: "根据薄弱点自动关联平台已审核通过的微课短视频与语法专项练习，支持一键导出高质量专业教学研判 PDF。",
          metrics: ["微课匹配", "攻坚目标", "PDF 导出", "白皮书缓存"]
        }
      ]}
    />
  )
}

export default DiagnosisCenter
