import type { Pose } from '../lib/scene/robot';

/**
 * ALL presentation content lives here. Add a slide = add an object.
 * Agenda, progress rail, overview grid and deep links (#slide-id) are generated from this list.
 */

export const deckMeta = {
  title: 'Generative AI',
  institution: 'North Central Mindanao College',
  program: 'TESDA · Generative AI',
  presenter: '', // optional, shown on the title slide when set
};

/** Where the 3D presenter stands for a slide. */
export interface Stage {
  x: number;
  y: number;
  scale: number;
  ry: number;
  pose: Pose;
  companion?: boolean;
}

interface Base {
  id: string;
  /** Short name for the rail / overview / agenda */
  label: string;
  stage: Stage;
}

export type IconName = 'text' | 'image' | 'audio' | 'video';
export type StepIcon = 'collect' | 'train' | 'distribute' | 'generate' | 'refine';

export interface TitleSlide extends Base {
  layout: 'title';
  kicker: string;
  /** `*word*` renders in the accent italic serif */
  lines: string[];
  lede: string;
  meta: { label: string; value: string }[];
}
export interface AgendaSlide extends Base {
  layout: 'agenda';
  kicker: string;
  lines: string[];
  items: string[]; // slide ids
}
export interface StatementSlide extends Base {
  layout: 'statement';
  kicker: string;
  lines: string[];
  body: string;
  example?: string;
  modalities: { icon: IconName; label: string }[];
}
export interface FlowSlide extends Base {
  layout: 'flow';
  kicker: string;
  lines: string[];
  sub: string;
  steps: { icon: StepIcon; label: string; hint: string }[];
}
export interface ProblemsSlide extends Base {
  layout: 'problems';
  kicker: string;
  lines: string[];
  items: string[];
}
export interface DividerSlide extends Base {
  layout: 'divider';
  kicker: string;
  lines: string[];
  items: string[]; // slide ids
}
export interface SectorSlide extends Base {
  layout: 'sector';
  kicker: string;
  lines: string[];
  points: string[];
}
export interface ToolsSlide extends Base {
  layout: 'tools';
  kicker: string;
  lines: string[];
  tools: { name: string; logo: string; maker: string; text: string }[];
}
export interface ClosingSlide extends Base {
  layout: 'closing';
  kicker: string;
  lines: string[];
  lede: string;
}

export interface SoftwareSlide extends Base {
  layout: 'software';
  kicker: string;
  lines: string[];
  items: { name: string; plan: string; paid: boolean; qty: number; logo?: string }[];
}
export interface EquipmentSlide extends Base {
  layout: 'equipment';
  kicker: string;
  lines: string[];
  items: { name: string; qty: number; note?: string; specs: { k: string; v: string }[] }[];
}

export type Slide =
  | SoftwareSlide
  | EquipmentSlide
  | TitleSlide
  | AgendaSlide
  | StatementSlide
  | FlowSlide
  | ProblemsSlide
  | DividerSlide
  | SectorSlide
  | ToolsSlide
  | ClosingSlide;

export const slides: Slide[] = [
  {
    id: 'title',
    label: 'Generative AI',
    layout: 'title',
    stage: { x: 3.4, y: -0.55, scale: 0.98, ry: -0.32, pose: 'wave', companion: true },
    kicker: deckMeta.program,
    lines: ['Generative', '*AI*'],
    lede: 'How machines learned to create, and how to put that to work.',
    meta: [
      { label: 'Institution', value: deckMeta.institution },
      { label: 'Program', value: 'TESDA Generative AI' },
    ],
  },
  {
    id: 'agenda',
    label: 'Agenda',
    layout: 'agenda',
    stage: { x: 3.6, y: -0.3, scale: 1.0, ry: -0.35, pose: 'present' },
    kicker: 'Agenda',
    lines: ['What we', '*will cover*'],
    items: ['what-is', 'how-it-works', 'what-it-solves', 'applications', 'tools', 'software', 'equipment'],
  },
  {
    id: 'what-is',
    label: 'What is Generative AI?',
    layout: 'statement',
    stage: { x: 3.7, y: -0.3, scale: 1.0, ry: -0.3, pose: 'present' },
    kicker: '01 — Definition',
    lines: ['Generative', '*AI*'],
    body:
      'Generative AI is a type of artificial intelligence that learns from existing information and uses it to create something new.',
    modalities: [
      { icon: 'text', label: 'Text' },
      { icon: 'image', label: 'Image' },
      { icon: 'audio', label: 'Audio' },
      { icon: 'video', label: 'Video' },
    ],
  },
  {
    id: 'how-it-works',
    label: 'How does it work?',
    layout: 'flow',
    stage: { x: 3.95, y: 1.6, scale: 0.46, ry: -0.35, pose: 'point' },
    kicker: '02 — Process',
    lines: ['How does', '*Generative AI work?*'],
    sub: 'Generative AI workflow',
    steps: [
      { icon: 'collect', label: 'Input data collection',
        hint: 'The AI first gathers a huge number of examples: books, websites, images and audio. Like a student collecting study materials.',
      },
      { icon: 'train', label: 'AI models training',
        hint: 'It studies those examples and learns the patterns: how sentences flow and what things look like. Like practicing until it gets good.',
      },
      { icon: 'distribute', label: 'Data distribution',
        hint: 'What it learned is spread across a network of connections, a bit like a brain, so it knows how ideas relate to each other.',
      },
      { icon: 'generate', label: 'New output generation',
        hint: 'You ask for something (a prompt). The AI uses what it learned to create something new: text, an image, audio or code.',
      },
      { icon: 'refine', label: 'Feedback refinement',
        hint: 'People rate and correct the results, and the AI uses that feedback to improve. Like a teacher marking your work.',
      },
    ],
  },
  {
    id: 'what-it-solves',
    label: 'What does it solve?',
    layout: 'problems',
    stage: { x: 4.0, y: 1.65, scale: 0.46, ry: -0.35, pose: 'think' },
    kicker: '03 — Value',
    lines: ['What does', '*Generative AI solve?*'],
    items: [
      'Lack of Ideas',
      'Time-Consuming Tasks',
      'Information Overload',
      'Difficulty Understanding Topics',
      'Communication Challenges',
      'Limited Creativity',
      'Repetitive Work',
      'Learning Difficulties',
    ],
  },
  {
    id: 'applications',
    label: 'Sample applications',
    layout: 'divider',
    stage: { x: -3.0, y: -0.35, scale: 1.0, ry: 0.32, pose: 'presentR', companion: true },
    kicker: '04 — Applications',
    lines: ['Sample', 'applications of', '*Generative AI*'],
    items: ['education', 'government', 'it'],
  },
  {
    id: 'education',
    label: 'Education',
    layout: 'sector',
    stage: { x: 3.7, y: -0.3, scale: 1.0, ry: -0.3, pose: 'present' },
    kicker: '04.1 — Application',
    lines: ['Generative AI in', '*Education*'],
    points: [
      'Develop lesson plans and instructional materials',
      'Generate examination questions and quizzes',
      'Prepare presentations and assessment rubrics',
    ],
  },
  {
    id: 'government',
    label: 'Government & Office Administration',
    layout: 'sector',
    stage: { x: 3.7, y: -0.3, scale: 1.0, ry: -0.3, pose: 'point' },
    kicker: '04.2 — Application',
    lines: ['Generative AI in Government', '*and Office Administration*'],
    points: [
      'Drafting memoranda, letters, and reports',
      'Summarizing meetings and documents',
      'Preparing presentations and information materials',
    ],
  },
  {
    id: 'it',
    label: 'Information Technology',
    layout: 'sector',
    stage: { x: 3.7, y: -0.3, scale: 1.0, ry: -0.3, pose: 'present' },
    kicker: '04.3 — Application',
    lines: ['Generative AI in', '*Information Technology*'],
    points: ['Software Development', 'Networking', 'IT Documentation and Project Management'],
  },
  {
    id: 'tools',
    label: 'Popular tools',
    layout: 'tools',
    stage: { x: 3.6, y: 1.4, scale: 0.3, ry: -0.35, pose: 'wave' },
    kicker: '05 — Tools',
    lines: ['Popular', '*Generative AI tools*'],
    tools: [
      { name: 'ChatGPT', logo: 'openai', maker: 'OpenAI', text: 'Generates text, answers questions, explains concepts, assists with coding, and supports research.' },
      { name: 'Google Gemini', logo: 'gemini', maker: 'Google', text: 'Assists with writing, research, reasoning, and multimodal tasks.' },
      { name: 'Microsoft Copilot', logo: 'copilot', maker: 'Microsoft', text: 'Supports productivity, writing, information gathering, and workplace tasks.' },
      { name: 'Canva', logo: 'canva', maker: 'Canva', text: 'Provides AI-assisted design, image generation, and presentation creation.' },
      { name: 'Adobe Firefly', logo: 'adobe', maker: 'Adobe', text: 'Creates and edits images and other creative content using AI.' },
      { name: 'Claude AI', logo: 'claude', maker: 'Anthropic', text: 'An AI assistant designed to help users with writing, research, summarization, document analysis, brainstorming, and coding.' },
    ],
  },
  {
    id: 'software',
    label: 'Software and digital tools',
    layout: 'software',
    stage: { x: 3.6, y: 1.4, scale: 0.3, ry: -0.35, pose: 'think' },
    kicker: '06 — Requirements',
    lines: ['Software and', '*digital tools*'],
    items: [
      { name: 'ChatGPT', plan: 'Go', paid: true, qty: 25, logo: 'openai' },
      { name: 'ChatGPT', plan: 'Plus', paid: true, qty: 1, logo: 'openai' },
      { name: 'Canva AI', plan: 'Pro', paid: true, qty: 2, logo: 'canva' },
      { name: 'Claude AI', plan: 'Pro', paid: true, qty: 1, logo: 'claude' },
      { name: 'Claude AI', plan: 'Free', paid: false, qty: 25, logo: 'claude' },
      { name: 'Google Gemini', plan: 'Free', paid: false, qty: 25, logo: 'gemini' },
      { name: 'Grammarly', plan: 'Free', paid: false, qty: 25 },
      { name: 'Google Workspace', plan: 'Free', paid: false, qty: 25, logo: 'google' },
      { name: 'Microsoft Office', plan: 'Free', paid: false, qty: 25, logo: 'office' },
      { name: 'Veyon Classroom Management', plan: 'Free', paid: false, qty: 1 },
      { name: 'GitHub', plan: 'Free', paid: false, qty: 25, logo: 'github' },
      { name: 'Vercel', plan: 'Free', paid: false, qty: 25, logo: 'vercel' },
    ],
  },
  {
    id: 'equipment',
    label: 'Equipment',
    layout: 'equipment',
    stage: { x: 3.6, y: 1.4, scale: 0.3, ry: -0.35, pose: 'point' },
    kicker: '06 — Requirements',
    lines: ['*Equipment*', 'and peripherals'],
    items: [
      {
        name: 'Computer with complete accessories / peripherals',
        qty: 26,
        note: 'At least or equivalent',
        specs: [
          { k: 'OS', v: 'Windows 11' },
          { k: 'CPU', v: 'Ryzen 7 5700G' },
          { k: 'SSD', v: '552 GB' },
          { k: 'HDD', v: '1 TB' },
          { k: 'Monitor', v: '24" LCD' },
          { k: 'Input', v: 'Mouse and keyboard' },
          { k: 'PSU', v: '800W Gold' },
          { k: 'Extras', v: 'Mousepad' },
        ],
      },
      {
        name: 'Smart TV',
        qty: 1,
        specs: [
          { k: 'Size', v: '65" · Black' },
          { k: 'Resolution', v: '4K (3,840 × 2,160)' },
          { k: 'HDMI input', v: '3' },
          { k: 'USB input', v: '1' },
          { k: 'Type', v: 'Smart' },
        ],
      },
      { name: 'HDMI cable', qty: 3, specs: [{ k: 'Length', v: '5 meters' }] },
    ],
  },
  {
    id: 'closing',
    label: 'Thank you',
    layout: 'closing',
    stage: { x: 3.4, y: -0.55, scale: 0.98, ry: -0.3, pose: 'wave', companion: true },
    kicker: 'Thank you',
    lines: ['Thank you.', '*Questions?*'],
    lede: deckMeta.institution + ' · ' + deckMeta.program,
  },
];
