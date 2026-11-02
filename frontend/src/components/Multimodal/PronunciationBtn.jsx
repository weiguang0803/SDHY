import { useCallback } from 'react';
import { VolumeIcon } from '../Common/Icons';

export default function PronunciationBtn({ word, pinyinTones = [] }) {
  const playAudio = useCallback(() => {
    // Strategy 1: For single pinyin syllables, use CDN pre-recorded audio
    if (pinyinTones && pinyinTones.length === 1) {
      const pinyinUrl = `https://cdn.jsdelivr.net/gh/pffy/mp3-chinese-pinyin-sound@master/mp3/${pinyinTones[0].toLowerCase()}.mp3`;
      const audio = new Audio(pinyinUrl);
      audio.play().catch(() => {
        // Fallback to Web Speech API
        speakWithWebSpeech(word);
      });
      return;
    }

    // Strategy 2: Web Speech API for words/sentences
    speakWithWebSpeech(word);
  }, [word, pinyinTones]);

  const speakWithWebSpeech = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <button
      className="pronunciation-btn"
      onClick={playAudio}
      title={`朗读：${word}`}
    >
      <VolumeIcon size={16} color="var(--primary)" />
      <span className="pron-word">{word}</span>
      <span className="pron-play-hint">点击朗读</span>
    </button>
  );
}
