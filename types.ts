
export interface SlidePlan {
  id: number;
  textOverlay: {
    headline: string;
    subheadline: string;
    tagline?: string;
  };
  visualMetaphor: string; // NEW: The explicit visual idea (e.g. "Phone with flatline graph")
  imagePrompt: string; // The full artistic prompt
  compositionNotes?: string; // Guidance on where to put text or subject
  includeCharacter: boolean;
}

export interface GeneratedSlide extends SlidePlan {
  imageUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  error?: string;
}

export type GenerationMode = 'topic' | 'custom';
export type Language = 'en' | 'es';
export type RenderMode = 'overlay' | 'ai-baked';

export interface TypographyStyle {
  id: string;
  name: string;
  fontFamilyDisplay: string;
  fontFamilyBody: string;
}

export interface VisualPreset {
  id: string;
  name: string;
  description: string; // Prompt instruction
  icon: string;
}

export interface UserConfig {
  profession: string;
  topic: string; // Used in Topic Mode
  customScript: string; // Used in Custom Mode
  mode: GenerationMode;
  renderMode: RenderMode; // NEW: Determines if text is CSS or Image-based
  referenceImage: string | null; // Base64 - Person
  styleReferenceImage: string | null; // Base64 - Design Style
  logoImage?: string | null; // Base64 - Logo
  brandColor: string;
  visualStyle: string; // This will hold the ID of the preset OR the custom string
  typography: string; // ID of TypographyStyle
  showPageNumbers: boolean;
  language: Language;
}

export enum GenerationStep {
  IDLE,
  PLANNING,
  GENERATING_IMAGES,
  COMPLETED
}

export const COLOR_PALETTES = [
  { name: 'Amarillo (Visu)', hex: '#FACC15' },
  { name: 'Lila Neon', hex: '#A855F7' },
  { name: 'Rojo Fuego', hex: '#EF4444' },
  { name: 'Verde Matrix', hex: '#22C55E' },
  { name: 'Naranja', hex: '#F97316' },
  { name: 'Escala de Grises', hex: '#E5E7EB' }, // High contrast white/gray
  { name: 'Azul Cyber', hex: '#3B82F6' },
];

export const TYPOGRAPHY_STYLES: TypographyStyle[] = [
  { id: 'bold', name: 'Impact & Modern', fontFamilyDisplay: 'Oswald', fontFamilyBody: 'Inter' },
  { id: 'minimal', name: 'Minimal & Clean', fontFamilyDisplay: 'Inter', fontFamilyBody: 'Inter' },
  { id: 'editorial', name: 'Elegant & Serif', fontFamilyDisplay: 'Playfair Display', fontFamilyBody: 'Lato' },
  { id: 'tech', name: 'Tech & Future', fontFamilyDisplay: 'Orbitron', fontFamilyBody: 'Roboto Mono' },
];

export const VISUAL_STYLES: VisualPreset[] = [
  { 
    id: 'cinematic', 
    name: 'Cinematic Motivational', 
    description: 'High contrast, dramatic lighting, movie poster aesthetic, rich textures, depth of field, focused and intense atmosphere.',
    icon: '🎬' 
  },
  { 
    id: 'minimal', 
    name: 'Minimalist Clean', 
    description: 'High key lighting, lots of negative space, soft shadows, clean lines, Apple-style aesthetic, sterile but premium environment.',
    icon: '⚪' 
  },
  { 
    id: 'cyberpunk', 
    name: 'Cyberpunk / Tech', 
    description: 'Neon accents, dark urban environment, holographic elements, futuristic interfaces, blue and purple tones (unless brand color differs).',
    icon: '🤖' 
  },
  { 
    id: 'editorial', 
    name: 'Editorial / Fashion', 
    description: 'Studio lighting, grain texture, fashion magazine editorial look, artistic angles, bold composition.',
    icon: '📸' 
  },
  { 
    id: 'business', 
    name: 'Modern Business', 
    description: 'Professional office environment, blurred city backgrounds, glass textures, suits, premium corporate look.',
    icon: '💼' 
  },
  { 
    id: 'urban', 
    name: 'Urban Street', 
    description: 'Street photography style, concrete textures, natural light, candid but polished, raw and authentic.',
    icon: '🏙️' 
  },
];

export const DICTIONARY = {
  en: {
    configTitle: 'CONFIGURATION',
    profession: 'Profession / Persona',
    modeTopic: 'By Topic (Auto)',
    modeCustom: 'Custom Script',
    renderModeLabel: 'Text Rendering Mode',
    renderOverlay: 'Professional Overlay (Crisp Text)',
    renderBaked: 'AI Integrated (Image Only)',
    topicLabel: 'Topic',
    scriptLabel: 'Script / Scene Breakdown',
    scriptHint: 'Provide rough notes or scene-by-scene',
    visualStyle: 'Visual Aesthetic',
    refPerson: 'Reference Person (Selfie)',
    refStyle: 'Carousel Style Ref (Optional)',
    clickUpload: 'CLICK TO UPLOAD',
    changePhoto: 'Change Photo',
    brandColor: 'Brand Color Palette',
    typography: 'Typography Style',
    pageNumbers: 'Show Page Numbers',
    generateBtn: 'GENERATE CAROUSEL',
    generatingBtn: 'GENERATING CONTENIDO...',
    results: 'RESULTS PREVIEW',
    rendering: 'Rendering...',
    download: 'Download',
    improveBtn: '✨ Improve with AI (Psychology & Hooks)',
    optimizing: 'Optimizing...',
    connectKey: 'To use the high-quality image generation features (Gemini 3 Pro), please connect your Google Cloud API Key.',
    connectBtn: 'Connect API Key',
    stepPlanning: 'Analyzing Content density & Planning Infographics...',
    error: 'ERROR',
    poweredBy: 'Powered by Gemini 2.5 Flash & Gemini 3 Pro Vision',
    customStylePlaceholder: 'Describe your custom style...',
    selectStyle: 'Select Style',
    custom: 'Custom'
  },
  es: {
    configTitle: 'CONFIGURACIÓN',
    profession: 'Profesión / Persona',
    modeTopic: 'Por Tema (Auto)',
    modeCustom: 'Guion Personalizado',
    renderModeLabel: 'Modo de Texto',
    renderOverlay: 'Superposición Pro (Texto Nítido)',
    renderBaked: 'Integrado por IA (Solo Imagen)',
    topicLabel: 'Tema',
    scriptLabel: 'Guion / Desglose de Escenas',
    scriptHint: 'Provee notas generales o escena por escena',
    visualStyle: 'Estética Visual',
    refPerson: 'Referencia Persona (Selfie)',
    refStyle: 'Ref. Estilo Carrusel (Opcional)',
    clickUpload: 'CLIC PARA SUBIR',
    changePhoto: 'Cambiar Foto',
    brandColor: 'Paleta de Colores de Marca',
    typography: 'Estilo de Tipografía',
    pageNumbers: 'Mostrar Número de Página',
    generateBtn: 'GENERAR CARRUSEL',
    generatingBtn: 'GENERANDO CONTENIDO...',
    results: 'VISTA PREVIA DE RESULTADOS',
    rendering: 'Renderizando...',
    download: 'Descargar',
    improveBtn: '✨ Mejorar con IA (Psicología y Ganchos)',
    optimizing: 'Optimizando...',
    connectKey: 'Para usar las funciones de generación de imágenes de alta calidad (Gemini 3 Pro), conecta tu Google Cloud API Key.',
    connectBtn: 'Conectar API Key',
    stepPlanning: 'Analizando densidad y Planificando Infografías...',
    error: 'ERROR',
    poweredBy: 'Impulsado por Gemini 2.5 Flash y Gemini 3 Pro Vision',
    customStylePlaceholder: 'Describe tu estilo personalizado...',
    selectStyle: 'Seleccionar Estilo',
    custom: 'Personalizado'
  }
};
