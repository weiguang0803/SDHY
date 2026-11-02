import React from 'react'
import ModulePlaceholder from '../Common/ModulePlaceholder'
import { AskDataIcon } from '../Common/AdminIcons'

const AskDataCenter = () => {
  return (
    <ModulePlaceholder
      icon={<AskDataIcon size={30} />}
      title="AI 智能问数台"
      englishTitle="AI Conversational Data Exploration & Analytics"
      phaseTag="Phase 5 · 二期储备"
      statusText="意图路由与模板设计中"
      problemStatement="用自然语言即问即答后台任意维度学情与运营数据"
      description="基于大模型意图路由与参数抽取能力，提供对话式学情与教学指标自助分析，支持预设业务模板、二次自然语言追问与自适应图表渲染。"
      featureCards={[
        {
          tag: "问数模板",
          title: "预设高频业务问数气泡",
          desc: "一键触发「统计本月留学生最常问的语法点」、「分析初级水平学员的提问偏好」等快捷查询。",
          metrics: ["高频模板", "一键发起", "业务快捷", "对话引导"]
        },
        {
          tag: "意图路由",
          title: "语义理解与动态参数抽取",
          desc: "精准识别时间区间、母语分类、知识点标签与学员群体，动态组装数据库统计查询条件。",
          metrics: ["语义解析", "参数抽取", "时间窗口", "实体对齐"]
        },
        {
          tag: "自适应图表",
          title: "动态结构化图表渲染",
          desc: "根据问答结果类型自动选择并渲染柱状图、折线趋势图、多维表格或统计卡片，支持图表一键导出。",
          metrics: ["自适应图表", "数据下载", "追问下钻", "报表输出"]
        }
      ]}
    />
  )
}

export default AskDataCenter
