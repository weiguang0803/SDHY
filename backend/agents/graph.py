from langgraph.graph import StateGraph, END
from backend.agents.state import AgentState
from backend.agents.intent_agent import intent_agent
from backend.agents.memory_agent import memory_agent
from backend.agents.knowledge_agent import knowledge_agent
from backend.agents.profile_agent import profile_agent
from backend.agents.orchestrator_agent import orchestrator_agent
from backend.agents.teaching_agent import teaching_agent
from backend.agents.multimodal_agent import multimodal_agent
from backend.agents.validator_agent import validator_agent

def should_retry(state: AgentState):
    validation = state.get("validation_result", {})
    if validation.get("passed", True) or state.get("retry_count", 0) >= 2:
        return END
    return "teaching_agent"

workflow = StateGraph(AgentState)
workflow.add_node("intent_agent", intent_agent)
workflow.add_node("memory_agent", memory_agent)
workflow.add_node("knowledge_agent", knowledge_agent)
workflow.add_node("profile_agent", profile_agent)
workflow.add_node("orchestrator_agent", orchestrator_agent)
workflow.add_node("teaching_agent", teaching_agent)
workflow.add_node("multimodal_agent", multimodal_agent)
workflow.add_node("validator_agent", validator_agent)

workflow.set_entry_point("intent_agent")
workflow.add_edge("intent_agent", "memory_agent")
workflow.add_edge("memory_agent", "knowledge_agent")
workflow.add_edge("knowledge_agent", "profile_agent")
workflow.add_edge("profile_agent", "orchestrator_agent")
workflow.add_edge("orchestrator_agent", "teaching_agent")
workflow.add_edge("teaching_agent", "multimodal_agent")
workflow.add_edge("multimodal_agent", "validator_agent")
workflow.add_conditional_edges("validator_agent", should_retry, {END: END, "teaching_agent": "teaching_agent"})

agent_graph = workflow.compile()
