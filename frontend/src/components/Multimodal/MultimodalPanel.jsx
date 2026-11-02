import { useState } from 'react';
import PronunciationBtn from './PronunciationBtn';
import HanziStroke from './HanziStroke';
import VocabImage from './VocabImage';
import VideoRecommend from './VideoRecommend';
import { VolumeIcon, PenToolIcon, ImageIcon, MultimodalIcon, PlayIcon } from '../Common/Icons';
import './MultimodalPanel.css';
import './VideoRecommend.css';

export default function MultimodalPanel({ items = [], videos = [] }) {
  const [expanded, setExpanded] = useState(true);

  if ((!items || items.length === 0) && (!videos || videos.length === 0)) return null;

  const hasAudio = items.some(item => item.type?.includes('audio'));
  const hasStroke = items.some(item => item.type?.includes('stroke_order'));
  const hasImage = items.some(item => item.type?.includes('image'));
  const hasVideo = videos && videos.length > 0;

  // Collect all stroke characters
  const strokeChars = [];
  items.forEach(item => {
    if (item.type?.includes('stroke_order') && item.characters_for_stroke) {
      item.characters_for_stroke.forEach(c => {
        if (!strokeChars.includes(c)) strokeChars.push(c);
      });
    }
  });

  // Collect image items
  const imageItems = items.filter(item => item.type?.includes('image') && (item.image_keyword || item.local_image_url || item.word));

  return (
    <div className="multimodal-panel slide-in-up">
      <div className="multimodal-header" onClick={() => setExpanded(!expanded)}>
        <div className="multimodal-header-left">
          <span className="multimodal-header-icon">
            <MultimodalIcon size={18} color="var(--primary)" />
          </span>
          <span className="multimodal-header-title">多模态教学资源</span>
          <div className="multimodal-badges">
            {hasAudio && <span className="mm-badge audio"><VolumeIcon size={12} /> 语音</span>}
            {hasStroke && <span className="mm-badge stroke"><PenToolIcon size={12} /> 笔顺</span>}
            {hasImage && <span className="mm-badge image"><ImageIcon size={12} /> 配图</span>}
            {hasVideo && <span className="mm-badge video"><PlayIcon size={12} /> 视频</span>}
          </div>
        </div>
        <span className="multimodal-toggle">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="multimodal-content">
          {/* Audio Section */}
          {hasAudio && (
            <div className="mm-section">
              <div className="mm-section-title">
                <VolumeIcon size={16} color="#6c63ff" /> 点击朗读发音
              </div>
              <div className="mm-audio-grid">
                {items.filter(item => item.type?.includes('audio')).map((item, i) => (
                  <PronunciationBtn 
                    key={i} 
                    word={item.word} 
                    pinyinTones={item.pinyin_tones || []} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stroke Order Section */}
          {hasStroke && strokeChars.length > 0 && (
            <div className="mm-section">
              <div className="mm-section-title">
                <PenToolIcon size={16} color="#14b8a6" /> 笔顺动画演示
              </div>
              <div className="mm-stroke-grid">
                {strokeChars.map((char, i) => (
                  <HanziStroke key={i} character={char} size={140} />
                ))}
              </div>
            </div>
          )}

          {/* Image Section */}
          {hasImage && imageItems.length > 0 && (
            <div className="mm-section">
              <div className="mm-section-title">
                <ImageIcon size={16} color="#f59e0b" /> 词汇图片展示
              </div>
              <div className="mm-image-grid">
                {imageItems.map((item, i) => (
                  <VocabImage 
                    key={i} 
                    keyword={item.image_keyword || item.word} 
                    word={item.word}
                    localImageUrl={item.local_image_url}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Video Recommend Section */}
          {hasVideo && (
            <div className="mm-section">
              <div className="mm-section-title">
                <PlayIcon size={16} color="#f43f5e" /> 推荐学习视频
              </div>
              <VideoRecommend videos={videos} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
