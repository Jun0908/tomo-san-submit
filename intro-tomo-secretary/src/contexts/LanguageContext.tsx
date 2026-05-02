import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "ja" | "en";

type Dict = Record<string, { ja: string; en: string }>;

export const t: Dict = {
  // Nav
  nav_about: { ja: "背景", en: "About" },
  nav_citizen: { ja: "市民向け", en: "Citizens" },
  nav_politician: { ja: "議員向け", en: "Politicians" },
  nav_tech: { ja: "技術", en: "Technology" },
  nav_vision: { ja: "展望", en: "Vision" },
  nav_cta: { ja: "導入相談", en: "Get in touch" },

  // Hero
  hero_kicker: { ja: "Political Intelligence DX", en: "Political Intelligence DX" },
  hero_title_1: { ja: "市民の声を、", en: "Turning citizen voices" },
  hero_title_2: { ja: "政治の知性", en: "into political intelligence" },
  hero_title_3: { ja: "に。", en: "." },
  hero_sub: {
    ja: "予定と公開情報を統合する、政治DXの新たな基盤。政治家が本来の使命である「政治判断」に専念できる環境を。AIが膨大な情報を構造化し、意思決定に必要なインサイトを先回りして届けます。",
    en: "A new foundation for political DX that unifies schedules and public information. We free politicians to focus on their core mission — political judgment — while AI structures vast information and proactively delivers the insights needed for decision-making.",
  },
  hero_cta_1: { ja: "システムを知る", en: "Explore the system" },
  hero_cta_2: { ja: "機能一覧", en: "View features" },
  stat_1: { ja: "市民相談受付", en: "Citizen intake" },
  stat_2: { ja: "会議直前ブリーフ", en: "Pre-meeting brief" },
  stat_3: { ja: "議会情報の自動紐付", en: "Auto cross-reference" },
  stat_4: { ja: "ナレッジ永続化", en: "Persistent knowledge" },
  scroll: { ja: "SCROLL", en: "SCROLL" },

  // About
  about_label: { ja: "Background & Purpose", en: "Background & Purpose" },
  about_title_1: { ja: "政治的意思決定を、", en: "Bringing data" },
  about_title_2: { ja: "データに基づくものへ。", en: "to political decision-making." },
  about_lead: {
    ja: "地方自治体の議員は、限られたリソースの中で「市民相談」「議会準備」「情報収集」という三位一体の業務を独力で遂行しなければなりません。本システムは、事務的作業に伴う認知負荷を大幅に低減し、政治判断の質を向上させる「政治知能のDX」を目指します。",
    en: "Local councillors must single-handedly juggle citizen consultations, council preparation, and information gathering with limited resources. This system dramatically reduces the cognitive load of administrative work and aims at a 'DX of political intelligence' that elevates the quality of political judgment.",
  },
  issue: { ja: "課題", en: "Issue" },
  issue_1_t: { ja: "事務リソースの枯渇", en: "Depleted administrative resources" },
  issue_1_d: { ja: "専任秘書不在の中で、アナログな相談管理と煩雑な事務作業が本来の政策立案時間を圧迫している。", en: "Without dedicated secretaries, analog case management and cumbersome paperwork crowd out time meant for policy-making." },
  issue_2_t: { ja: "情報のサイロ化", en: "Information silos" },
  issue_2_d: { ja: "市民の声、自治体の公開情報、個人スケジュールが分断され、多角的な政策検討が困難。", en: "Citizen voices, municipal public data, and personal schedules are fragmented, making multi-angle policy review difficult." },
  issue_3_t: { ja: "情報の非対称性", en: "Information asymmetry" },
  issue_3_d: { ja: "膨大な議会公開情報やRSSフィードをタイムリーに把握できず、議論の機を逸するリスク。", en: "Vast public council data and RSS feeds cannot be tracked in time, risking missed opportunities for debate." },
  about_quote: {
    ja: "本システムは議員の判断を代替するものではありません。情報を整理・構造化し、適切なタイミングで提供することで、議員が「データに基づいた確かな意思決定」を行えるよう支援するインテリジェントなパートナーです。",
    en: "This system does not replace a politician's judgment. By organizing and structuring information and delivering it at the right moment, it acts as an intelligent partner that empowers data-driven decision-making.",
  },
  about_quote_em: { ja: "データに基づいた確かな意思決定", en: "data-driven decision-making" },

  // Citizen
  citizen_label: { ja: "For Citizens", en: "For Citizens" },
  citizen_title_1: { ja: "透明性の向上と、", en: "Greater transparency," },
  citizen_title_2: { ja: "行政参画の心理的障壁の撤廃。", en: "removing barriers to civic participation." },
  citizen_lead: {
    ja: "市民向けフロントエンドは、単なる受付窓口ではなく、政治家と市民の「非同期コミュニケーション」を最適化し、説明責任を果たすためのプラットフォームです。",
    en: "The citizen-facing frontend is more than an intake form — it is a platform that optimizes asynchronous communication between politicians and citizens and fulfills accountability.",
  },
  c1_t: { ja: "対話型UIによる相談受付", en: "Conversational intake UI" },
  c1_d: { ja: "ブラウザから自然言語で相談を入力。複雑な申請フォームを排除し、市民の課題を「生の声」として吸い上げます。", en: "Citizens describe issues in natural language from their browser. Complex forms are eliminated and raw voices are captured directly." },
  c2_t: { ja: "AI動画による情報伝達", en: "AI video responses" },
  c2_d: { ja: "AIが生成する Talking Head 動画で返答。親しみやすいインターフェースで、政治への心理的距離を縮めます。", en: "AI-generated talking-head videos respond to citizens, narrowing the psychological distance to politics." },
  c3_t: { ja: "案件ステータスの可視化", en: "Case status visibility" },
  c3_d: { ja: "「受理」「対応中」など進捗をリアルタイム公開。心理的安全性を提供し、行政側の事務負荷も軽減。", en: "Statuses like 'Received' and 'In Progress' are published in real time, providing assurance and reducing admin overhead." },

  // Politician
  pol_label: { ja: "For Politicians · Telegram", en: "For Politicians · Telegram" },
  pol_title_1: { ja: "ワークフローを加速する、", en: "Accelerating the workflow:" },
  pol_title_2: { ja: "Telegram連携ブリーフィング。", en: "Telegram-integrated briefings." },
  pol_lead: { ja: "日常的なコミュニケーションツールであるTelegramをインターフェースとし、議員の一日に寄り添った情報提供を自動化します。", en: "Using Telegram — an everyday tool — as the interface, we automate information delivery throughout a politician's day." },
  p1_t: { ja: "おはようブリーフ", en: "Morning Brief" },
  p1_s: { ja: "Executive Summary", en: "Executive Summary" },
  p1_d: { ja: "毎朝、その日のスケジュール、Gmailの重要通知、タスク期限、新規市民相談を統合して要約。一日の優先順位を数分で把握。", en: "Each morning, today's schedule, key Gmail notifications, task deadlines, and new citizen requests are summarized — priorities in minutes." },
  p2_t: { ja: "3分ブリーフ", en: "3-Minute Brief" },
  p2_s: { ja: "Tactical Support", en: "Tactical Support" },
  p2_d: { ja: "予定の30分前に、関連する過去の市民相談・議会公開情報とともに「確認すべき3つの重要ポイント」をプッシュ通知。", en: "30 minutes before each meeting, push three key points to review along with related past consultations and council records." },
  p3_t: { ja: "日次市民ダイジェスト", en: "Daily Digest" },
  p3_s: { ja: "Strategic Review", en: "Strategic Review" },
  p3_d: { ja: "一日の終わりに、寄せられた相談の傾向や緊急度の高い案件を報告。翌日以降の政策優先順位策定に寄与。", en: "At day's end, report consultation trends and urgent cases to inform tomorrow's policy priorities." },
  p4_t: { ja: "即時ナレッジアクセス", en: "Instant Knowledge Access" },
  p4_s: { ja: "On-Demand", en: "On-Demand" },
  p4_d: { ja: "「/search [キーワード]」で過去案件検索、「/case」でステータス確認。移動中でも必要な情報に瞬時にアクセス。", en: "Use /search [keyword] to find past cases and /case to check status — instant access on the move." },
  p5_t: { ja: "活動報告書作成支援", en: "Activity Report Drafting" },
  p5_s: { ja: "Auto Drafting", en: "Auto Drafting" },
  p5_d: { ja: "面会メモや断片的な記録から、活動報告書のドラフトを自動生成。事務作業を市民との対話・政策立案へ転換。", en: "Auto-generate report drafts from meeting notes and fragments, redirecting clerical time to dialogue and policy work." },

  // Data Integration
  di_label: { ja: "Intelligent Data Integration", en: "Intelligent Data Integration" },
  di_title_1: { ja: "バラバラなデータを、", en: "From scattered data" },
  di_title_2: { ja: "検索可能な知識へ。", en: "to searchable knowledge." },
  di_1_t: { ja: "公開情報の自動クロスリファレンス", en: "Auto cross-referencing of public data" },
  di_1_d: { ja: "市議会や役所のRSSフィードを常時巡回。市民相談と議会情報を自動で紐付け、政策課題の背景を即座に特定。", en: "Continuously crawls council and city RSS feeds, automatically linking citizen issues to council records." },
  di_2_t: { ja: "Google Workspaceとの統合", en: "Google Workspace integration" },
  di_2_d: { ja: "カレンダー、メール、タスクとシームレスに同期。スケジュール変動をリアルタイム検知し、ブリーフィングを動的更新。", en: "Seamless sync with Calendar, Mail, and Tasks — schedule changes update briefings in real time." },
  di_3_t: { ja: "Obsidian Markdownナレッジベース", en: "Obsidian Markdown knowledge base" },
  di_3_d: { ja: "全情報を構造化Markdownで蓄積。議員交代やスタッフ変更にも耐える「組織的な政治記憶」を担保。", en: "All information stored as structured Markdown — an institutional political memory that survives staff turnover." },

  // Tech
  tech_label: { ja: "Technology Stack", en: "Technology Stack" },
  tech_title_1: { ja: "堅牢な推論エンジンと、", en: "A robust reasoning engine" },
  tech_title_2: { ja: "信頼性の高いデータ連携基盤。", en: "and a reliable data fabric." },
  tech_cat_1: { ja: "フロントエンド", en: "Frontend" },
  tech_role_1: { ja: "相談受付UIおよび進捗可視化ページ", en: "Intake UI and status visualization pages" },
  tech_cat_2: { ja: "推論エンジン / AI", en: "Reasoning / AI" },
  tech_role_2: { ja: "思考・要約・案件化のコアロジック", en: "Core logic for reasoning, summarizing, and case creation" },
  tech_cat_3: { ja: "動画生成基盤", en: "Video generation" },
  tech_role_3: { ja: "親しみやすさを醸成するAI動画生成", en: "AI video generation that builds approachability" },
  tech_cat_4: { ja: "データ連携・認証", en: "Data & Auth" },
  tech_role_4: { ja: "既存ワークフローとのシームレスな統合", en: "Seamless integration with existing workflows" },
  tech_cat_5: { ja: "モバイルUI", en: "Mobile UI" },
  tech_role_5: { ja: "現場での即時ブリーフィングおよび検索", en: "Instant on-site briefings and search" },
  tech_cat_6: { ja: "ナレッジ管理", en: "Knowledge management" },
  tech_role_6: { ja: "自治体情報収集および構造化蓄積", en: "Municipal data collection and structured storage" },

  // Vision
  vision_label: { ja: "Benefits & Vision", en: "Benefits & Vision" },
  v_for_pol: { ja: "FOR POLITICIANS", en: "FOR POLITICIANS" },
  v_pol_t: { ja: "政治的生産性の飛躍的向上", en: "A leap in political productivity" },
  v_pol_1_h: { ja: "認知負荷の低減：", en: "Lower cognitive load: " },
  v_pol_1_d: { ja: "煩雑な情報収集・整理をAIに委ね、高度な政治判断にリソースを集中。", en: "Delegate tedious gathering and organizing to AI, and concentrate on higher-order political judgment." },
  v_pol_2_h: { ja: "対応品質の標準化：", en: "Consistent quality: " },
  v_pol_2_d: { ja: "過去の経緯や公開情報を踏まえた、精度の高い議会質問や市民対応の実現。", en: "Higher-precision council questions and citizen responses, grounded in history and public data." },
  v_for_cit: { ja: "FOR CITIZENS", en: "FOR CITIZENS" },
  v_cit_t: { ja: "行政への信頼と参画実感の向上", en: "More trust and a real sense of participation" },
  v_cit_1_h: { ja: "アクセシビリティ：", en: "Accessibility: " },
  v_cit_1_d: { ja: "24時間365日、親しみやすい動画インターフェースで声を届けられる環境。", en: "A 24/7 friendly video interface for citizens to be heard." },
  v_cit_2_h: { ja: "プロセスの透明化：", en: "Process transparency: " },
  v_cit_2_d: { ja: "自身の要望が政治のプロセスにどう載っているか確認でき、民主主義への参画実感を獲得。", en: "Citizens can see how their requests move through the political process, gaining a felt sense of participation." },
  vision_kicker: { ja: "FUTURE VISION", en: "FUTURE VISION" },
  vision_t_1: { ja: "21世紀型ローカル・デモクラシーの、", en: "Building a model for" },
  vision_t_2: { ja: "モデルを構築する。", en: "21st-century local democracy." },
  vision_d: {
    ja: "本システムは、単なる業務効率化ツールに留まりません。LLMと公共データを融合させることで、政治家と市民の距離を再定義し、より透明で、よりデータに基づいた「21世紀の地方民主主義」を実現するためのマイルストーン。市民一人ひとりの声が確実に政策へ反映される未来を、私たちはデジタルの力で切り拓きます。",
    en: "This is not merely an efficiency tool. By fusing LLMs with public data, it redefines the distance between politicians and citizens — a milestone toward a more transparent, data-driven 21st-century local democracy where every voice is reliably reflected in policy.",
  },

  // CTA
  cta_t: { ja: "政治を、アップデートする。", en: "Let's update politics." },
  cta_d: { ja: "TOMOの導入相談・デモンストレーションをご希望の方は、お気軽にお問い合わせください。", en: "For consultations and demos of TOMO, please get in touch." },
  cta_1: { ja: "導入を相談する", en: "Request a consultation" },
  cta_2: { ja: "資料をダウンロード", en: "Download materials" },

  // Footer
  ft_lead: { ja: "政治家秘書AI。市民の声を政治の知性に変換する、ローカル・デモクラシーのためのインテリジェント・パートナー。", en: "AI political secretary. An intelligent partner for local democracy that turns citizen voices into political intelligence." },
  ft_product: { ja: "Product", en: "Product" },
  ft_company: { ja: "Company", en: "Company" },
  ft_contact: { ja: "Contact", en: "Contact" },
  ft_copy: { ja: "© 2026 TOMO — Political Intelligence DX", en: "© 2026 TOMO — Political Intelligence DX" },
  ft_tag: { ja: "Designed for 21st century local democracy.", en: "Designed for 21st century local democracy." },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; tr: (k: keyof typeof t) => string };
const LanguageContext = createContext<Ctx | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("ja");
  const tr = (k: keyof typeof t) => t[k]?.[lang] ?? String(k);
  return <LanguageContext.Provider value={{ lang, setLang, tr }}>{children}</LanguageContext.Provider>;
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
};
