export interface SlidePlan {
  id: number;
  textOverlay: {
    headline: string;
    subheadline: string;
    tagline?: string;
  };
  visualMetaphor: string; 
  imagePrompt: string; 
  compositionNotes?: string; 
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
  name: {
    en: string;
    es: string;
  };
  description: {
    en: string;
    es: string;
  }; 
  icon: string;
}

export interface UserConfig {
  profession: string;
  topic: string; 
  customScript: string; 
  mode: GenerationMode;
  renderMode: RenderMode; 
  referenceImage: string | null; 
  styleReferenceImage: string | null; 
  logoImage?: string | null; 
  brandColor: string;
  visualStyle: string; 
  typography: string; 
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
  { name: 'Violeta Visu', hex: '#7C3AED' },
  { name: 'Azul Eléctrico', hex: '#3B82F6' },
  { name: 'Amarillo Gold', hex: '#FACC15' },
  { name: 'Rojo Impacto', hex: '#EF4444' },
  { name: 'Verde Éxito', hex: '#10B981' },
  { name: 'Blanco Clean', hex: '#F9FAFB' },
  { name: 'Negro Profundo', hex: '#111827' },
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
    name: { en: 'Cinematic Motivational', es: 'Cinematográfico Motivacional' },
    description: {
      en: 'Dark, high contrast, dramatic lighting, movie poster aesthetic. Metallic textures, cold blues/blacks with warm highlights. Intense and focused atmosphere.',
      es: 'Oscuro, alto contraste, iluminación dramática, estética de póster de película. Texturas metálicas, negros/azules fríos con toques cálidos. Atmósfera intensa y enfocada.'
    },
    icon: '🎬' 
  },
  { 
    id: 'minimal', 
    name: { en: 'Minimalist Clean', es: 'Minimalista Limpio' },
    description: {
      en: 'High key lighting, lots of negative space, soft shadows, clean lines, Apple-style aesthetic, sterile but premium environment.',
      es: 'Iluminación de clave alta, mucho espacio negativo, sombras suaves, líneas limpias, estética estilo Apple, entorno estéril pero premium.'
    },
    icon: '⚪' 
  },
  { 
    id: 'disruptive', 
    name: { en: 'Disruptive / Grunge', es: 'Disruptivo / Grunge' },
    description: {
      en: 'Raw aesthetic, torn paper textures, tape, doodles, high contrast black & white with bold yellow accents. Rebellious and unfiltered.',
      es: 'Estética cruda, texturas de papel rasgado, cinta, garabatos, alto contraste blanco y negro con acentos amarillos audaces. Rebelde y sin filtros.'
    },
    icon: '💥' 
  },
  { 
    id: 'educational', 
    name: { en: 'Modular Educational', es: 'Modular Educativo' },
    description: {
      en: 'Grid layouts, beige/neutral backgrounds, clear "Error vs Fix" comparisons, red/green checkmarks, instructional and structured.',
      es: 'Diseños de cuadrícula, fondos beige/neutros, comparaciones claras de "Error vs Solución", marcas de verificación rojas/verdes, instructivo y estructurado.'
    },
    icon: '📚' 
  },
  { 
    id: 'masterclass', 
    name: { en: 'Staged Masterclass', es: 'Masterclass en Escena' },
    description: {
      en: 'Studio setting, whiteboard or flipchart, professional lighting (purple/blue), speaker with microphone, backstage or workshop vibe.',
      es: 'Escenario de estudio, pizarra o rotafolio, iluminación profesional (púrpura/azul), orador con micrófono, ambiente de backstage o taller.'
    },
    icon: '🎓' 
  },
  { 
    id: 'impact', 
    name: { en: 'High Impact Type', es: 'Tipografía de Impacto' },
    description: {
      en: 'Solid bold backgrounds, massive typography, high contrast colors. No distractions, just pure message and authority.',
      es: 'Fondos de colores sólidos y audaces, tipografía masiva, colores de alto contraste. Sin distracciones, solo mensaje puro y autoridad.'
    },
    icon: '📢' 
  },
  { 
    id: 'comic', 
    name: { en: 'Emotional Comic', es: 'Cómic Emocional' },
    description: {
      en: 'Hand-drawn illustration style, white background, simple expressive characters, speech bubbles, intimate and vulnerable tone.',
      es: 'Estilo de ilustración dibujado a mano, fondo blanco, personajes expresivos simples, burbujas de texto, tono íntimo y vulnerable.'
    },
    icon: '💬' 
  },
  { 
    id: 'gradient', 
    name: { en: 'Gradient Pop', es: 'Pop con Gradientes' },
    description: {
      en: 'Clean white background, ultra-bold text with vibrant gradients (pink/orange/purple), simple emotive imagery (e.g. emojis or objects).',
      es: 'Fondo blanco limpio, texto ultra negrita con gradientes vibrantes (rosa/naranja/púrpura), imágenes emotivas simples (ej. emojis u objetos).'
    },
    icon: '🌈' 
  },
  { 
    id: 'cyberpunk', 
    name: { en: 'Cyberpunk / Tech', es: 'Cyberpunk / Tech' },
    description: {
      en: 'Neon accents, dark urban environment, holographic elements, futuristic interfaces, blue and purple tones.',
      es: 'Acentos de neón, entorno urbano oscuro, elementos holográficos, interfaces futuristas, tonos azules y púrpuras.'
    },
    icon: '🤖' 
  },
  { 
    id: 'editorial', 
    name: { en: 'Editorial / Fashion', es: 'Editorial / Moda' },
    description: {
      en: 'Studio lighting, grain texture, fashion magazine editorial look, artistic angles, bold composition.',
      es: 'Iluminación de estudio, textura de grano, aspecto editorial de revista de moda, ángulos artísticos, composición audaz.'
    },
    icon: '📸' 
  },
];

export const DICTIONARY = {
  en: {
    statusLabel: 'STATUS',
    statusActive: 'AI ACTIVE',
    statusInactive: 'AI INACTIVE',
    configTitle: 'STRATEGY CENTER',
    profession: 'Profession / Identity',
    modeTopic: 'Auto Topic',
    modeCustom: 'Custom Narrative',
    renderModeLabel: 'Creative Output',
    renderOverlay: 'Overlay Pro',
    renderBaked: 'AI Integrated',
    topicLabel: 'Concept',
    scriptLabel: 'Script Breakdown',
    scriptHint: 'Notes or scene breakdown',
    visualStyle: 'Aesthetic Direction',
    refPerson: 'Face Reference',
    refStyle: 'Style Inspo (Optional)',
    clickUpload: 'UPLOAD',
    changePhoto: 'Change',
    brandColor: 'Brand Accents',
    typography: 'Typography',
    pageNumbers: 'Page Numbers',
    generateBtn: 'START GENERATION',
    generatingBtn: 'CRAFTING CONTENT...',
    results: 'STORYBOARD PREVIEW',
    rendering: 'Polishing...',
    download: 'Export',
    improveBtn: '✨ Psychology Boost',
    optimizing: 'Refining...',
    connectKey: 'To enable 4K generation (Gemini 3 Pro), connect your Google Cloud AI Key.',
    connectBtn: 'Connect AI Studio Key',
    stepPlanning: 'Mapping Narrative Flow...',
    error: 'ACCESS DENIED',
    poweredBy: 'Generated by VisuContenido © 2025',
    customStylePlaceholder: 'Custom aesthetic description...',
    selectStyle: 'Style Selection',
    custom: 'Custom',
    apiKeyError: 'An API Key must be set. Please check your connection.'
  },
  es: {
    statusLabel: 'ESTADO',
    statusActive: 'IA ACTIVA',
    statusInactive: 'IA INACTIVA',
    configTitle: 'CENTRO ESTRATÉGICO',
    profession: 'Profesión / Identidad',
    modeTopic: 'Tema Auto',
    modeCustom: 'Narrativa Propia',
    renderModeLabel: 'Formato de Salida',
    renderOverlay: 'Superposición Pro',
    renderBaked: 'IA Integrada',
    topicLabel: 'Concepto / Idea',
    scriptLabel: 'Desglose del Guion',
    scriptHint: 'Notas o guion por escena',
    visualStyle: 'Dirección Estética',
    refPerson: 'Referencia de Rostro',
    refStyle: 'Inspo de Estilo (Opcional)',
    clickUpload: 'SUBIR',
    changePhoto: 'Cambiar',
    brandColor: 'Acentos de Marca',
    typography: 'Tipografía',
    pageNumbers: 'Números de Página',
    generateBtn: 'INICIAR GENERACIÓN',
    generatingBtn: 'CREANDO CONTENIDO...',
    results: 'VISTA PREVIA DEL STORYBOARD',
    rendering: 'Puliendo...',
    download: 'Exportar',
    improveBtn: '✨ Impulso Psicológico',
    optimizing: 'Refinando...',
    connectKey: 'Para activar la generación 4K (Gemini 3 Pro), conecta tu Google Cloud AI Key.',
    connectBtn: 'Conectar Key de AI Studio',
    stepPlanning: 'Mapeando Flujo Narrativo...',
    error: 'ACCESO DENEGADO',
    poweredBy: 'Generado por VisuContenido © 2025',
    customStylePlaceholder: 'Describe tu estética...',
    selectStyle: 'Selección de Estilo',
    custom: 'Personalizado',
    apiKeyError: 'Se debe configurar una API Key. Por favor, verifica tu conexión.'
  }
};