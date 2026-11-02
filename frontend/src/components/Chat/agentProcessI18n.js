/**
 * 师道汉韵 (SDHY) - 智能体协同推演多语种自适应国际化套件
 * 针对二语学习者国际化痛点：根据用户母语背景自适应显示，兜底保底为通用语言英语 (English)。
 * 支持语种：英语(en)、中文(zh)、法语(fr)、西班牙语(es)、日语(ja)、韩语(ko)、卢旺达语(rw)、俄语(ru)、阿拉伯语(ar)
 */

export const SUPPORTED_LANGS = [
  { code: 'auto', name: 'Auto (自适应)', flag: '🌐' },
  { code: 'en', name: 'English (通用保底)', flag: '🇬🇧' },
  { code: 'zh', name: '简体中文', flag: '🇨🇳' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'rw', name: 'Ikinyarwanda', flag: '🇷🇼' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
];

export const I18N_PACKS = {
  en: {
    code: 'en',
    name: 'English',
    short: 'EN',
    headerTitle: 'Multi-Agent Reasoning Pipeline',
    statusRunning: 'Processing',
    statusDone: 'Completed',
    runningSuffix: ' (in progress...)',
    agents: {
      intent_agent: { name: 'Intent Recognition', desc: 'Analyzing user intent & language alignment' },
      memory_agent: { name: 'Tiered Memory Engine', desc: 'Retrieving working, episodic & L3 cognitive memory' },
      knowledge_agent: { name: 'Knowledge RAG Agent', desc: 'Matching official curriculum & multimodal assets' },
      profile_agent: { name: 'Learner Profile Matcher', desc: 'Aligning HSK level & native language background' },
      orchestrator_agent: { name: 'Pedagogical Strategist', desc: 'Formulating tailored scaffolding & bilingual plan' },
      teaching_agent: { name: 'Instruction Generator', desc: 'Synthesizing tailored lesson & standard examples' },
      multimodal_agent: { name: 'Multimodal Dispatcher', desc: 'Dispatching sketches, micro-courses & stroke animations' },
      validator_agent: { name: 'Quality & Safety Guard', desc: 'Validating 5-dimension pedagogical criteria & tone accuracy' }
    }
  },
  zh: {
    code: 'zh',
    name: '简体中文',
    short: '中',
    headerTitle: '智能体协同处理过程',
    statusRunning: '运行中',
    statusDone: '已完成',
    runningSuffix: '（正在协同推演中...）',
    agents: {
      intent_agent: { name: '意图识别', desc: '分析用户意图与语言' },
      memory_agent: { name: '分层记忆', desc: '检索短期/情景/持久记忆' },
      knowledge_agent: { name: '知识检索', desc: '匹配官方知识库与教具' },
      profile_agent: { name: '画像匹配', desc: '匹配用户学习画像' },
      orchestrator_agent: { name: '教学策略', desc: '制定个性化教学方案' },
      teaching_agent: { name: '生成回复', desc: '生成教学内容与规范例句' },
      multimodal_agent: { name: '多模态直出', desc: '直出简笔画/微课/笔顺教具' },
      validator_agent: { name: '质量验证', desc: '五维质量与小语种校验' }
    }
  },
  fr: {
    code: 'fr',
    name: 'Français',
    short: 'FR',
    headerTitle: 'Processus Collaboratif Multi-Agents',
    statusRunning: 'En cours',
    statusDone: 'Terminé',
    runningSuffix: ' (analyse en cours...)',
    agents: {
      intent_agent: { name: 'Détection d\'Intention', desc: 'Analyse de l\'intention et du contexte linguistique' },
      memory_agent: { name: 'Mémoire Hiérarchisée', desc: 'Récupération de la mémoire de travail et du profil L3' },
      knowledge_agent: { name: 'Recherche Pédagogique', desc: 'Association avec la base de connaissances officielle' },
      profile_agent: { name: 'Profil de l\'Apprenant', desc: 'Alignement du niveau HSK et de la langue maternelle' },
      orchestrator_agent: { name: 'Stratège Pédagogique', desc: 'Élaboration de la stratégie d\'étayage bilingue' },
      teaching_agent: { name: 'Générateur de Cours', desc: 'Synthèse de la leçon bilingue et des phrases types' },
      multimodal_agent: { name: 'Distributeur Multimodal', desc: 'Attribution de croquis, micro-vidéos et animations de traits' },
      validator_agent: { name: 'Contrôleur Qualité', desc: 'Validation 5D de la rigueur pédagogique et linguistique' }
    }
  },
  es: {
    code: 'es',
    name: 'Español',
    short: 'ES',
    headerTitle: 'Flujo Colaborativo Multi-Agente',
    statusRunning: 'En proceso',
    statusDone: 'Completado',
    runningSuffix: ' (en progreso...)',
    agents: {
      intent_agent: { name: 'Reconocimiento de Intención', desc: 'Análisis de la intención y del contexto lingüístico' },
      memory_agent: { name: 'Motor de Memoria', desc: 'Recuperación de memoria de trabajo y perfil cognitivo L3' },
      knowledge_agent: { name: 'Agente RAG de Contenido', desc: 'Búsqueda en la base de conocimientos oficial' },
      profile_agent: { name: 'Perfil del Estudiante', desc: 'Alineación de nivel HSK y lengua materna' },
      orchestrator_agent: { name: 'Estratega Pedagógico', desc: 'Formulación del plan de andamiaje bilingüe' },
      teaching_agent: { name: 'Generador de Respuestas', desc: 'Síntesis de lección bilingüe y ejemplos estándar' },
      multimodal_agent: { name: 'Distribuidor Multimodal', desc: 'Envío de bocetos, micro-cursos y orden de trazos' },
      validator_agent: { name: 'Validador de Calidad', desc: 'Evaluación 5D de adecuación pedagógica y lingüística' }
    }
  },
  ja: {
    code: 'ja',
    name: '日本語',
    short: 'JA',
    headerTitle: 'マルチエージェント協調推論プロセス',
    statusRunning: '実行中',
    statusDone: '完了',
    runningSuffix: '（協調推論中...）',
    agents: {
      intent_agent: { name: '意図認識', desc: 'ユーザーの学習意図と言語文脈を分析' },
      memory_agent: { name: '階層化メモリ', desc: '短期・文脈・長期L3認知プロファイルを検索' },
      knowledge_agent: { name: '知識検索RAG', desc: '公式教育知識ベースおよび教材リソースと照合' },
      profile_agent: { name: '学習者プロファイル', desc: 'HSKレベルと母語背景をマッチング' },
      orchestrator_agent: { name: '指導ストラテジスト', desc: '個別最適化された二言語指導プランを策定' },
      teaching_agent: { name: '教材応答生成', desc: '標準的な例文と体系的解説コンテンツを生成' },
      multimodal_agent: { name: 'マルチモーダル配信', desc: '線画スケッチ・15秒動画・筆順アニメーションを配信' },
      validator_agent: { name: '品質・安全性検証', desc: '5次元教育基準および多言語表現を検証' }
    }
  },
  ko: {
    code: 'ko',
    name: '한국어',
    short: 'KO',
    headerTitle: '멀티 에이전트 협업 추론 파이프라인',
    statusRunning: '실행 중',
    statusDone: '완료',
    runningSuffix: ' (협업 추론 진행 중...)',
    agents: {
      intent_agent: { name: '의도 분석', desc: '사용자 의도 및 언어 맥락 분석' },
      memory_agent: { name: '계층형 메모리', desc: '단기 대화 및 L3 인지 프로필 검색' },
      knowledge_agent: { name: '지식 검색 RAG', desc: '공식 표준 지식베이스 및 교육 리소스 매칭' },
      profile_agent: { name: '학습자 프로필', desc: 'HSK 등급 및 모국어 배경 맞춤 연계' },
      orchestrator_agent: { name: '교수 전략 수립', desc: '개인 맞춤형 이중 언어 스캐폴딩 전략 설계' },
      teaching_agent: { name: '학습 응답 생성', desc: '체계적인 강의 및 표준 예문 생성' },
      multimodal_agent: { name: '멀티모달 제공', desc: '스케치 삽화·마이크로 강의 영상·획순 제공' },
      validator_agent: { name: '품질 검증', desc: '5차원 교육 적합도 및 다국어 정확도 검증' }
    }
  },
  rw: {
    code: 'rw',
    name: 'Ikinyarwanda',
    short: 'RW',
    headerTitle: 'Urukurikirane rw\'Ubwenge bw\'Abakozi',
    statusRunning: 'Birimo gukorwa',
    statusDone: 'Byarangiye',
    runningSuffix: ' (birimo gusesengurwa...)',
    agents: {
      intent_agent: { name: 'Gusobanukirwa Umugambi', desc: 'Gusesengura icyo umunyeshuri akeneye n\'ururimi' },
      memory_agent: { name: 'Kwibuka no Kubika', desc: 'Gushaka amateka y\'imyigire n\'ibyakunze kugorana' },
      knowledge_agent: { name: 'Gushakisha Ubumenyi', desc: 'Guhuza n\'igitabo cyemewe cy\'amasomo n\'imfashanyigisho' },
      profile_agent: { name: 'Ibiranga Umunyeshuri', desc: 'Guhuza urwego rwa HSK n\'ururimi kavukire' },
      orchestrator_agent: { name: 'Gutegura Inyigisho', desc: 'Guhitamo uburyo bunoze bwo kwigisha mu ndimi ebyiri' },
      teaching_agent: { name: 'Gukora Inyigisho', desc: 'Gukora ibisobanuro n\'ingero z\'ibiganiro' },
      multimodal_agent: { name: 'Gutanga Amashusho', desc: 'Gutanga ibishushanyo, amashusho magufi n\'imyandikire' },
      validator_agent: { name: 'Kugenzura Ubuziranenge', desc: 'Kugenzura ko inyigisho zujuje ubuziranenge budashidikanywaho' }
    }
  },
  ru: {
    code: 'ru',
    name: 'Русский',
    short: 'RU',
    headerTitle: 'Конвейер Совместной Работы Агентов',
    statusRunning: 'В процессе',
    statusDone: 'Завершено',
    runningSuffix: ' (выполняется анализ...)',
    agents: {
      intent_agent: { name: 'Распознавание Намерения', desc: 'Анализ намерения пользователя и языка' },
      memory_agent: { name: 'Многоуровневая Память', desc: 'Извлечение кратковременной памяти и профиля L3' },
      knowledge_agent: { name: 'Поиск в Базе Знаний', desc: 'Сопоставление с официальными учебными материалами' },
      profile_agent: { name: 'Профиль Учащегося', desc: 'Учет уровня HSK и родного языка' },
      orchestrator_agent: { name: 'Методист Обучения', desc: 'Разработка стратегии двуязычного обучения' },
      teaching_agent: { name: 'Генератор Ответа', desc: 'Создание учебного материала и примеров' },
      multimodal_agent: { name: 'Мультимодальный Агент', desc: 'Выдача иллюстраций, микро-видео и анимации иероглифов' },
      validator_agent: { name: 'Контроль Качества', desc: 'Пятимерная проверка корректности и безопасности' }
    }
  },
  ar: {
    code: 'ar',
    name: 'العربية',
    short: 'AR',
    headerTitle: 'مسار التفكير التعاوني للوكلاء',
    statusRunning: 'قيد التنفيذ',
    statusDone: 'مكتمل',
    runningSuffix: ' (جاري الاستنتاج التعاوني...)',
    agents: {
      intent_agent: { name: 'التعرف على القصد', desc: 'تحليل قصد المستخدم والسياق اللغوي' },
      memory_agent: { name: 'الذاكرة المتعددة الطبقات', desc: 'استرجاع الذاكرة التشغيلية وملف L3 المعرفي' },
      knowledge_agent: { name: 'استرجاع المعرفة الرسمية', desc: 'مطابقة المنهج التعليمي المعتمد والموارد' },
      profile_agent: { name: 'ملف المتعلم الشخصي', desc: 'مطابقة مستوى HSK والخلفية اللغوية' },
      orchestrator_agent: { name: 'خبير الاستراتيجية التعليمية', desc: 'صياغة استراتيجية التدريس ثنائي اللغة' },
      teaching_agent: { name: 'منشئ المحتوى التعليمي', desc: 'توليد الدروس النموذجية والأمثلة الدقيقة' },
      multimodal_agent: { name: 'موفر الوسائط المتعددة', desc: 'تقديم الرسوم البيانية ومقاطع الفيديو ورسوم الكتابة' },
      validator_agent: { name: 'مدقق الجودة اللغوية', desc: 'التحقق خماسي الأبعاد من الدقة التعليمية والسلامة' }
    }
  }
};

/**
 * 根据学习者画像母语背景或环境全自动自适应检测语种代码
 * 保底策略：若未识别到匹配语种或无设置，100% 优雅回退到通用英语 (en)
 */
export function resolveAgentLang(userNativeLang) {
  if (!userNativeLang) return 'en';
  const raw = String(userNativeLang).trim().toLowerCase();

  // 1. 日语 (Japanese / 日本語 / 日语)
  if (raw === 'ja' || raw === 'jp' || raw.includes('日') || raw.includes('japan')) return 'ja';

  // 2. 韩语 (Korean / 한국어 / 韩语)
  if (raw === 'ko' || raw === 'kr' || raw.includes('韩') || raw.includes('korea')) return 'ko';

  // 3. 法语 (French / Français / 法语)
  if (raw === 'fr' || raw.includes('法') || raw.includes('french') || raw.includes('français')) return 'fr';

  // 4. 西班牙语 (Spanish / Español / 西班牙语) - 严格防止 "japanese" 包含 "es"
  if (raw === 'es' || raw.includes('西') || raw.includes('spanish') || raw.includes('español')) return 'es';

  // 5. 卢旺达语 (Kinyarwanda / 卢旺达语)
  if (raw === 'rw' || raw.includes('卢旺达') || raw.includes('kinyarwanda') || raw.includes('rwanda')) return 'rw';

  // 6. 俄语 (Russian / Русский / 俄语)
  if (raw === 'ru' || raw.includes('俄') || raw.includes('russian') || raw.includes('русск')) return 'ru';

  // 7. 阿拉伯语 (Arabic / العربية / 阿拉伯语)
  if (raw === 'ar' || raw.includes('阿') || raw.includes('arabic') || raw.includes('عربي')) return 'ar';

  // 8. 中文 (Chinese / 中文)
  if (raw === 'zh' || raw === 'cn' || raw.includes('中') || raw.includes('chinese')) return 'zh';

  // 9. 英语 (English / 英语)
  if (raw === 'en' || raw.includes('英') || raw.includes('english')) return 'en';

  // 10. 核心保底策略：全球通用语言英语 (English)
  return 'en';
}

/**
 * 动态翻译与美化智能体完成事件输出的原始消息
 * 将后端吐出的中文状态描述实时映射为流畅的目标语言短语
 */
export function formatAgentResult(rawMessage, lang = 'en') {
  if (!rawMessage || typeof rawMessage !== 'string') return '';
  if (lang === 'zh') return rawMessage;

  const msg = rawMessage.trim();

  // 1. 意图识别 (Intent Agent)
  if (msg.includes('意图识别为')) {
    const typeMatch = msg.match(/意图识别为[：:]\s*([^\s｜|]+)/);
    const kpMatch = msg.match(/核心知识点[：:]\s*([^｜|]+)/);
    const twMatch = msg.match(/映射目标中文词[：:]\s*(.*)/);

    const type = typeMatch ? typeMatch[1] : 'question';
    const kp = kpMatch ? kpMatch[1].trim() : 'concept';
    const tw = twMatch && twMatch[1] ? ` | Target: ${twMatch[1].trim()}` : '';

    if (lang === 'en') return `🎯 Intent identified: ${type} | Key concept: ${kp}${tw}`;
    if (lang === 'fr') return `🎯 Intention identifiée: ${type} | Notion clé: ${kp}${tw}`;
    if (lang === 'es') return `🎯 Intención identificada: ${type} | Concepto clave: ${kp}${tw}`;
    if (lang === 'ja') return `🎯 意図識別: ${type} | 核心知識点: ${kp}${tw}`;
    if (lang === 'ko') return `🎯 학습 의도 파악: ${type} | 핵심 개념: ${kp}${tw}`;
    if (lang === 'rw') return `🎯 Umugambi wamenyekanye: ${type} | Iby'ingenzi: ${kp}${tw}`;
    if (lang === 'ru') return `🎯 Намерение определено: ${type} | Ключевая концепция: ${kp}${tw}`;
    if (lang === 'ar') return `🎯 تم تحديد القصد: ${type} | المفهوم الأساسي: ${kp}${tw}`;
  }

  // 2. 分层记忆 (Memory Agent)
  if (msg.includes('分层记忆装配完毕') || msg.includes('分层记忆')) {
    const l1Match = msg.match(/L1短期对话[：:]\s*(\d+)轮/);
    const turns = l1Match ? l1Match[1] : '0';

    if (lang === 'en') return `🧠 Tiered memory loaded | L1 working: ${turns} turns | L2 context & L3 profile active`;
    if (lang === 'fr') return `🧠 Mémoire activée | L1 dialogue: ${turns} tours | Contexte L2 et profil L3 prêts`;
    if (lang === 'es') return `🧠 Memoria cargada | L1 diálogo: ${turns} turnos | Contexto L2 y perfil L3 listos`;
    if (lang === 'ja') return `🧠 階層化メモリ配置完了 | L1短期対話: ${turns}回 | L2文脈とL3プロファイル同期`;
    if (lang === 'ko') return `🧠 계층형 메모리 로드 완료 | L1 단기 대화: ${turns}회 | L2 맥락 및 L3 프로필 활성화`;
    if (lang === 'rw') return `🧠 Amakuru y'imvugo yashyizweho | L1 ibiganiro: ${turns} | L2 & L3 birakora`;
    if (lang === 'ru') return `🧠 Память загружена | L1 диалог: ${turns} реплик | L2 контекст и профиль L3 активны`;
    if (lang === 'ar') return `🧠 تم تحميل الذاكرة | محادثات L1: ${turns} جولات | سياق L2 وملف L3 نشطان`;
  }

  // 3. 知识检索 (Knowledge Agent)
  if (msg.includes('知识库精准命中')) {
    const wordMatch = msg.match(/【(.*?)】/);
    const word = wordMatch ? wordMatch[1] : '';
    if (lang === 'en') return `📚 Knowledge base hit:【${word}】| Authoritative definitions & multimedia assets locked`;
    if (lang === 'fr') return `📚 Base de connaissances:【${word}】| Définitions et ressources officielles vérifiées`;
    if (lang === 'es') return `📚 Base de conocimientos:【${word}】| Definición y recursos oficiales verificados`;
    if (lang === 'ja') return `📚 知識ベース照合成功:【${word}】| 権威ある解説とマルチモーダル教材を確保`;
    if (lang === 'ko') return `📚 지식베이스 일치 성공:【${word}】| 표준 교육 해설 및 교구 자산 확인`;
    if (lang === 'rw') return `📚 Ubumenyi bwabonetse:【${word}】| Ibisobanuro byemewe n'amashusho birateguye`;
    if (lang === 'ru') return `📚 Найдено в базе знаний:【${word}】| Закреплены эталонные материалы`;
    if (lang === 'ar') return `📚 تم العثور في قاعدة المعرفة:【${word}】| تم تأمين التعريفات المعتمدة`;
  }
  if (msg.includes('知识库未包含特定词条')) {
    if (lang === 'en') return `📖 General knowledge mode: Contextual reasoning engaged smoothly`;
    if (lang === 'fr') return `📖 Mode connaissances générales: Raisonnement contextuel engagé`;
    if (lang === 'es') return `📖 Modo de conocimiento general: Razonamiento contextual activado`;
    if (lang === 'ja') return `📖 汎用推論モード: 文脈に応じた個別最適化解説を生成`;
    if (lang === 'ko') return `📖 일반 지식 모드: 문맥 기반 맞춤형 추론으로 전환`;
    if (lang === 'rw') return `📖 Ubumenyi rusange: Gusesengura hakurikijwe imyandikire`;
    if (lang === 'ru') return `📖 Режим общих знаний: Включен контекстный вывод`;
    if (lang === 'ar') return `📖 وضع المعرفة العامة: بدء التفكير السياقي بسلاسة`;
  }

  // 4. 画像匹配 (Profile Agent)
  if (msg.includes('已锁定学习者认知画像')) {
    const levelMatch = msg.match(/HSK\s*等级[：:]\s*([^｜|]+)/);
    const langMatch = msg.match(/母语[：:]\s*(.*)/);
    const lvl = levelMatch ? levelMatch[1].trim() : 'Beginner';
    const nl = langMatch ? langMatch[1].trim() : 'English';

    if (lang === 'en') return `👤 Learner profile matched | HSK level: ${lvl} | Native language: ${nl}`;
    if (lang === 'fr') return `👤 Profil apprenant: Niveau HSK ${lvl} | Langue: ${nl}`;
    if (lang === 'es') return `👤 Perfil del estudiante: Nivel HSK ${lvl} | Idioma: ${nl}`;
    if (lang === 'ja') return `👤 学習者プロファイル特定 | HSKレベル: ${lvl} | 母語: ${nl}`;
    if (lang === 'ko') return `👤 학습자 프로필 확인 | HSK 등급: ${lvl} | 모국어: ${nl}`;
    if (lang === 'rw') return `👤 Ibiranga umunyeshuri | Urwego rwa HSK: ${lvl} | Ururimi kavukire: ${nl}`;
    if (lang === 'ru') return `👤 Профиль учащегося | Уровень HSK: ${lvl} | Родной язык: ${nl}`;
    if (lang === 'ar') return `👤 ملف المتعلم الشخصي | مستوى HSK: ${lvl} | اللغة الأم: ${nl}`;
  }

  // 5. 教学策略 (Orchestrator Agent)
  if (msg.includes('教学策略制定完毕')) {
    const methodMatch = msg.match(/教学法[：:]\s*([^｜|]+)/);
    const modeMatch = msg.match(/双语模式[：:]\s*(.*)/);
    const method = methodMatch ? methodMatch[1].trim() : 'Scaffolding';
    const mode = modeMatch ? modeMatch[1].trim() : 'Bilingual';

    if (lang === 'en') return `🎭 Strategy ready | Method: ${method} | Bilingual scaffold: ${mode}`;
    if (lang === 'fr') return `🎭 Stratégie validée | Méthode: ${method} | Mode: ${mode}`;
    if (lang === 'es') return `🎭 Estrategia definida | Método: ${method} | Modo: ${mode}`;
    if (lang === 'ja') return `🎭 指導計画策定 | 教授法: ${method} | バイリンガル構成: ${mode}`;
    if (lang === 'ko') return `🎭 교수 전략 수립 완료 | 교육법: ${method} | 이중 언어 모드: ${mode}`;
    if (lang === 'rw') return `🎭 Uburyo bwo kwigisha bwateguwe | Uburyo: ${method} | Indimi: ${mode}`;
    if (lang === 'ru') return `🎭 Стратегия готова | Метод: ${method} | Режим: ${mode}`;
    if (lang === 'ar') return `🎭 تم إعداد الاستراتيجية | الطريقة: ${method} | النمط: ${mode}`;
  }

  // 6. 生成回复 (Teaching Agent)
  if (msg.includes('双语教学内容生成完毕')) {
    if (lang === 'en') return `✨ Lesson synthesized | Aligned with TCSOL 5 standard bilingual modules`;
    if (lang === 'fr') return `✨ Leçon synthétisée | Conforme aux 5 modules d'enseignement international`;
    if (lang === 'es') return `✨ Lección generada | Alineada con los 5 módulos estándar internacionales`;
    if (lang === 'ja') return `✨ 教学コンテンツ生成完了 | 国際中国語教育の5大標準構成に厳格準拠`;
    if (lang === 'ko') return `✨ 학습 콘텐츠 생성 완료 | 국제 표준 5대 이중 언어 모듈 규격 일치`;
    if (lang === 'rw') return `✨ Isomo ryateguwe | Ryujuje ibisabwa mu nyigisho 5 z'ingenzi z'Igishinwa`;
    if (lang === 'ru') return `✨ Материал готов | Соответствует 5 стандартам международного китайского языка`;
    if (lang === 'ar') return `✨ تم إنشاء المحتوى التعليمي | متوافق مع المعايير الدولية الخمسة لتعليم الصينية`;
  }

  // 7. 多模态直出 (Multimodal Agent)
  if (msg.includes('多模态教具装配完毕')) {
    const hasSketch = msg.includes('简笔画：已直出') || msg.includes('简笔画: 已直出');
    const hasVideo = msg.includes('教学微课：已直出') || msg.includes('教学微课: 已直出');
    const sketchStr = hasSketch ? 'Injected' : 'None';
    const videoStr = hasVideo ? 'Injected' : 'External Standby';

    if (lang === 'en') return `🎨 Multimodal assets ready | Sketch: ${sketchStr} | Video: ${videoStr}`;
    if (lang === 'fr') return `🎨 Ressources prêtes | Croquis: ${hasSketch ? 'Oui' : 'Non'} | Vidéo: ${hasVideo ? 'Oui' : 'Attente'}`;
    if (lang === 'es') return `🎨 Recursos listos | Boceto: ${hasSketch ? 'Sí' : 'No'} | Video: ${hasVideo ? 'Sí' : 'En espera'}`;
    if (lang === 'ja') return `🎨 マルチモーダル教具準備完了 | スケッチ: ${hasSketch ? '付与' : 'なし'} | 微課動画: ${hasVideo ? '付与' : '予備'}`;
    if (lang === 'ko') return `🎨 멀티모달 교구 준비 완료 | 스케치: ${hasSketch ? '장착' : '없음'} | 영상: ${hasVideo ? '장착' : '대기'}`;
    if (lang === 'rw') return `🎨 Imfashanyigisho ziteguye | Igishushanyo: ${hasSketch ? 'Yego' : 'Oya'} | Video: ${hasVideo ? 'Yego' : 'Tegereza'}`;
    if (lang === 'ru') return `🎨 Мультимедиа готово | Рисунок: ${hasSketch ? 'Да' : 'Нет'} | Видео: ${hasVideo ? 'Да' : 'Внешнее'}`;
    if (lang === 'ar') return `🎨 الوسائط المتعددة جاهزة | رسم: ${hasSketch ? 'نعم' : 'لا'} | فيديو: ${hasVideo ? 'نعم' : 'احتياطي'}`;
  }

  // 8. 质量验证 (Validator Agent)
  if (msg.includes('五维质量校验')) {
    const scoreMatch = msg.match(/得分[：:]\s*(\d+)/);
    const score = scoreMatch ? scoreMatch[1] : '48';
    const isPassed = !msg.includes('未通过');

    if (lang === 'en') return `✅ 5-Dimension quality check ${isPassed ? 'Passed' : 'Failed'} | Score: ${score}/50`;
    if (lang === 'fr') return `✅ Contrôle qualité 5D ${isPassed ? 'Réussi' : 'Échoué'} | Score: ${score}/50`;
    if (lang === 'es') return `✅ Control de calidad 5D ${isPassed ? 'Aprobado' : 'Rechazado'} | Puntuación: ${score}/50`;
    if (lang === 'ja') return `✅ 5次元教育品質検証${isPassed ? '合格' : '不合格'} | スコア: ${score}/50`;
    if (lang === 'ko') return `✅ 5차원 품질 검증 ${isPassed ? '통과' : '미통과'} | 평가 점수: ${score}/50`;
    if (lang === 'rw') return `✅ Kugenzura ubuziranenge ${isPassed ? 'Byatsinze' : 'Byanze'} | Amanota: ${score}/50`;
    if (lang === 'ru') return `✅ 5-мерная проверка качества ${isPassed ? 'Пройдена' : 'Не пройдена'} | Балл: ${score}/50`;
    if (lang === 'ar') return `✅ فحص الجودة خماسي الأبعاد ${isPassed ? 'ناجح' : 'غير ناجح'} | الدرجة: ${score}/50`;
  }

  // 默认：英语直接呈现简洁提示
  return lang === 'en' ? `Step finished: ${msg}` : msg;
}
