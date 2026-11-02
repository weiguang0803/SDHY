import { useSSE } from '../../hooks/useSSE';
import useChatStore from '../../stores/chatStore';
import { SparklesIcon } from '../Common/Icons';
import './SuggestedQuestions.css';

export default function SuggestedQuestions({ questions = [] }) {
  const { sendMessage } = useSSE();
  const currentConversationId = useChatStore(state => state.currentConversationId);
  const isStreaming = useChatStore(state => state.isStreaming);

  if (!questions || questions.length === 0) return null;

  const handleQuestionClick = (qText) => {
    if (isStreaming || !currentConversationId) return;
    sendMessage(currentConversationId, qText);
  };

  return (
    <div className="suggested-questions-container slide-in-up">
      <div className="suggested-questions-header">
        <SparklesIcon size={14} color="var(--primary)" />
        <span className="suggested-questions-title">您可能还想问：</span>
      </div>
      <div className="suggested-questions-chips">
        {questions.map((q, idx) => (
          <button 
            key={idx}
            className="suggested-question-chip"
            onClick={() => handleQuestionClick(q)}
            disabled={isStreaming}
            title="点击自动提问"
          >
            <span className="chip-icon">💡</span>
            <span className="chip-text">{q}</span>
            <span className="chip-arrow">➔</span>
          </button>
        ))}
      </div>
    </div>
  );
}
