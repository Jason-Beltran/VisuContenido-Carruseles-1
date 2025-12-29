import React, { useState, useEffect } from 'react';
import { UserConfig, GeneratedSlide, GenerationStep, COLOR_PALETTES, TYPOGRAPHY_STYLES, DICTIONARY, VISUAL_STYLES } from './types';
import { InputSection } from './components/InputSection';
import { ResultCarousel } from './components/ResultCarousel';
import { generateCarouselPlan, generateSlideImage, generateSingleSlidePlan } from './services/geminiService';

const LOCAL_STORAGE_KEY = 'VISU_CREATOR_API_KEY';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [isAiActive, setIsAiActive] = useState(false);
  const [manualKey, setManualKey] = useState(localStorage.getItem(LOCAL_STORAGE_KEY) || '');
  const [config, setConfig] = useState<UserConfig>({
    profession: 'Creador Digital',
    topic: '3 Secretos de iluminación para TikTok',
    customScript: '',
    mode: 'topic',
    renderMode: 'overlay',
    referenceImage: null,
    styleReferenceImage: null,
    brandColor: COLOR_PALETTES[0].hex, 
    visualStyle: VISUAL_STYLES[0].id, 
    typography: TYPOGRAPHY_STYLES[0].id,
    showPageNumbers: false,
    language: 'es'
  });

  const [slides, setSlides] = useState<GeneratedSlide[]>([]);
  const [step, setStep] = useState<GenerationStep>(GenerationStep.IDLE);
  const [error, setError] = useState<string | null>(null);

  const t = DICTIONARY[config.language];

  const checkKeyStatus = async () => {
    try {
      // 1. Check direct environment
      const envKey = process.env.API_KEY && process.env.API_KEY !== "";
      // 2. Check manually stored key
      const storedKey = !!localStorage.getItem(LOCAL_STORAGE_KEY);
      // 3. Check AI Studio bridge
      let hasBridgeKey = false;
      if ((window as any).aistudio) {
        hasBridgeKey = await (window as any).aistudio.hasSelectedApiKey();
      }
      
      const active = envKey || storedKey || hasBridgeKey;
      setIsAiActive(active);
      return active;
    } catch (e) {
      console.debug("Error checking API key status:", e);
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      const active = await checkKeyStatus();
      setHasKey(active);
    };
    init();
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
      } catch (e) {
        console.error("Failed to open AI Studio key selector:", e);
      }
    }
    setHasKey(true);
    setTimeout(checkKeyStatus, 1500);
  };

  const handleSaveManualKey = () => {
    if (manualKey.trim().length > 10) {
      localStorage.setItem(LOCAL_STORAGE_KEY, manualKey.trim());
      setHasKey(true);
      setIsAiActive(true);
      setError(null);
    } else {
      setError(config.language === 'es' ? "Por favor ingresa una clave válida." : "Please enter a valid key.");
    }
  };

  const translateError = (msg: string) => {
    if (msg.includes("API Key must be set") || msg.includes("API_KEY")) return t.apiKeyError;
    if (msg.includes("Requested entity was not found")) return config.language === 'es' ? "Error de API: La clave no es válida o no tiene facturación." : "API Error: Key invalid or no active billing.";
    return msg;
  };

  const handleGenerate = async () => {
    const isReady = await checkKeyStatus();
    if (!isReady) {
      setError(t.apiKeyError);
      setHasKey(false);
      return;
    }

    setError(null);
    setStep(GenerationStep.PLANNING);
    setSlides([]);

    try {
      const plan = await generateCarouselPlan(config);
      const initialSlides: GeneratedSlide[] = plan.map(p => ({ ...p, status: 'pending' }));
      setSlides(initialSlides);
      setStep(GenerationStep.GENERATING_IMAGES);

      for (let i = 0; i < initialSlides.length; i++) {
        setSlides(prev => prev.map(s => s.id === initialSlides[i].id ? { ...s, status: 'generating' } : s));
        try {
          const imageUrl = await generateSlideImage(initialSlides[i], config.referenceImage, config);
          setSlides(prev => prev.map(s => s.id === initialSlides[i].id ? { ...s, status: 'completed', imageUrl } : s));
        } catch (err: any) {
           const translatedMsg = translateError(err.message || "Failed");
           setSlides(prev => prev.map(s => s.id === initialSlides[i].id ? { ...s, status: 'error', error: translatedMsg } : s));
           
           if (err.message && (err.message.includes("API Key") || err.message.includes("not found"))) {
             setIsAiActive(false);
             setError(translatedMsg);
             return; 
           }
        }
      }
      setStep(GenerationStep.COMPLETED);
    } catch (err: any) {
      setError(translateError(err.message || "Error inesperado."));
      setStep(GenerationStep.IDLE);
    }
  };

  const handleRegenerateSlide = async (slideId: number, refinementPrompt?: string) => {
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, status: 'generating' } : s));
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return;
    try {
      const imageUrl = await generateSlideImage(slide, config.referenceImage, config, refinementPrompt);
      setSlides(prev => prev.map(s => s.id === slideId ? { ...s, status: 'completed', imageUrl } : s));
    } catch (err: any) {
       setSlides(prev => prev.map(s => s.id === slideId ? { ...s, status: 'error', error: translateError(err.message) } : s));
    }
  };

  const handleRegenerateAll = async (refinementPrompt: string) => {
    setStep(GenerationStep.PLANNING);
    setSlides([]);
    try {
      const plan = await generateCarouselPlan(config, refinementPrompt);
      const initialSlides: GeneratedSlide[] = plan.map(p => ({ ...p, status: 'pending' }));
      setSlides(initialSlides);
      setStep(GenerationStep.GENERATING_IMAGES);
      for (let i = 0; i < initialSlides.length; i++) {
        setSlides(prev => prev.map(s => s.id === initialSlides[i].id ? { ...s, status: 'generating' } : s));
        try {
          const imageUrl = await generateSlideImage(initialSlides[i], config.referenceImage, config);
          setSlides(prev => prev.map(s => s.id === initialSlides[i].id ? { ...s, status: 'completed', imageUrl } : s));
        } catch (err: any) {
           setSlides(prev => prev.map(s => s.id === initialSlides[i].id ? { ...s, status: 'error', error: translateError(err.message) } : s));
        }
      }
      setStep(GenerationStep.COMPLETED);
    } catch (err: any) {
      setError(translateError(err.message));
      setStep(GenerationStep.IDLE);
    }
  };

  const handleInsertSlide = async (index: number, instruction: string) => {
    const tempId = Date.now();
    const placeholder: GeneratedSlide = {
      id: tempId,
      textOverlay: { headline: 'Creando...', subheadline: '...', tagline: 'Nuevo' },
      visualMetaphor: '...',
      imagePrompt: '...',
      includeCharacter: false,
      status: 'generating'
    };
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, placeholder);
    setSlides(newSlides);
    try {
      const newPlan = await generateSingleSlidePlan(config, instruction, 'INTERMEDIATE');
      setSlides(prev => prev.map(s => s.id === tempId ? { ...s, ...newPlan, status: 'generating' } : s));
      const imageUrl = await generateSlideImage(newPlan, config.referenceImage, config);
      setSlides(prev => prev.map(s => s.id === newPlan.id ? { ...s, status: 'completed', imageUrl } : s));
    } catch (err) {
      setSlides(prev => prev.filter(s => s.id !== tempId));
    }
  };

  const handleAddCTA = async (instruction: string) => {
    const tempId = Date.now();
    const placeholder: GeneratedSlide = {
      id: tempId,
      textOverlay: { headline: 'Generando CTA...', subheadline: '...', tagline: 'CTA' },
      visualMetaphor: '...',
      imagePrompt: '...',
      includeCharacter: true,
      status: 'generating'
    };
    setSlides(prev => [...prev, placeholder]);
    try {
      const newPlan = await generateSingleSlidePlan(config, instruction, 'CTA');
      setSlides(prev => prev.map(s => s.id === tempId ? { ...s, ...newPlan, status: 'generating' } : s));
      const imageUrl = await generateSlideImage(newPlan, config.referenceImage, config);
      setSlides(prev => prev.map(s => s.id === newPlan.id ? { ...s, status: 'completed', imageUrl } : s));
    } catch (err) {
      setSlides(prev => prev.filter(s => s.id !== tempId));
    }
  };

  if (!hasKey) {
     return (
        <div className="min-h-screen bg-visu-black text-white flex flex-col items-center justify-center p-6 text-center">
             <div className="mb-12 relative magic-glow">
                <div className="absolute -inset-10 bg-visu-purple/20 blur-3xl rounded-full float-anim"></div>
                <h1 className="text-5xl md:text-8xl font-display font-bold uppercase tracking-tighter relative">
                   Visu<span className="text-visu-purple">Creator</span>
                </h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest mt-2">By VisuContenido</p>
             </div>

             <div className="max-w-xl w-full glass-card rounded-4xl p-8 mb-8 text-left shadow-premium border-visu-purple/20">
               <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                 <span className="w-8 h-8 rounded-full bg-visu-purple flex items-center justify-center text-sm shadow-aura">1</span>
                 {t.manualKeyTitle}
               </h2>
               <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                 {config.language === 'es' 
                   ? "Para usar VisuCreator, necesitas una clave de Gemini API. Puedes conectarla automáticamente o pegarla manualmente abajo."
                   : "To use VisuCreator, you need a Gemini API key. You can connect it automatically or paste it manually below."}
               </p>
               
               <button 
                 onClick={handleSelectKey} 
                 className="shimmer-btn w-full bg-visu-purple text-white hover:bg-visu-purple-light px-8 py-4 rounded-2xl font-bold uppercase tracking-wider transition-all shadow-aura hover:shadow-aura-hover flex items-center justify-center gap-3 border border-white/10 mb-8"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                  </svg>
                  {t.connectBtn}
               </button>

               <div className="flex items-center gap-4 mb-8">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <span className="text-[10px] font-bold text-gray-500 tracking-[0.2em]">{t.manualKeyOr}</span>
                  <div className="h-px bg-white/10 flex-1"></div>
               </div>

               <div className="space-y-4">
                  <input 
                    type="password"
                    value={manualKey}
                    onChange={(e) => setManualKey(e.target.value)}
                    placeholder={t.manualKeyPlaceholder}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-visu-purple focus:outline-none transition-all placeholder:text-gray-600"
                  />
                  <button 
                    onClick={handleSaveManualKey}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all border border-white/5"
                  >
                    {t.manualKeySave}
                  </button>
               </div>

               {error && (
                 <div className="mt-6 text-red-400 text-[10px] font-bold uppercase tracking-widest text-center animate-pulse">
                   {error}
                 </div>
               )}
             </div>

             <footer className="text-gray-600 text-[10px] uppercase tracking-[0.2em]">
                {t.poweredBy}
             </footer>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-visu-black p-4 md:p-8 font-sans selection:bg-visu-purple selection:text-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b border-white/5 pb-8 flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div className="relative magic-glow">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tighter">
              Visu<span style={{ color: config.brandColor }}>Creator</span>
            </h1>
            <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">
              By VisuContenido
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-[9px] uppercase font-bold text-gray-500 mb-1">{t.statusLabel}</span>
                {isAiActive ? (
                  <span className="text-[10px] font-bold uppercase py-1 px-3 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 ai-aura">
                    {t.statusActive}
                  </span>
                ) : (
                  <span onClick={() => setHasKey(false)} className="text-[10px] font-bold uppercase py-1 px-3 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 cursor-pointer hover:bg-red-500/20 transition-all">
                    {t.statusInactive}
                  </span>
                )}
             </div>
             <button 
               onClick={() => setConfig({...config, language: config.language === 'en' ? 'es' : 'en'})}
               className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-xs font-bold hover:bg-white/5 transition-colors"
             >
               {config.language.toUpperCase()}
             </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-3xl mb-8 font-medium backdrop-blur-md animate-fade-in flex items-center gap-3 shadow-magic">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
             <div className="text-sm">{error}</div>
             {!isAiActive && (
               <button onClick={() => setHasKey(false)} className="ml-auto text-[10px] font-bold uppercase underline tracking-widest">{config.language === 'es' ? 'CAMBIAR CLAVE' : 'CHANGE KEY'}</button>
             )}
          </div>
        )}

        <InputSection 
          config={config} 
          setConfig={setConfig} 
          onGenerate={handleGenerate}
          isGenerating={step !== GenerationStep.IDLE && step !== GenerationStep.COMPLETED}
        />

        {step === GenerationStep.PLANNING && (
           <div className="text-center py-20 flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mb-6 shadow-aura" style={{ borderColor: config.brandColor, borderTopColor: 'transparent' }}></div>
              <div className="text-sm font-bold font-display uppercase tracking-[0.3em] animate-pulse" style={{ color: config.brandColor }}>
                {t.stepPlanning}
              </div>
           </div>
        )}

        <ResultCarousel 
          slides={slides} 
          brandColor={config.brandColor} 
          showPageNumbers={config.showPageNumbers}
          typographyId={config.typography}
          language={config.language}
          renderMode={config.renderMode}
          onRegenerate={handleRegenerateSlide}
          onRegenerateAll={handleRegenerateAll}
          onInsertSlide={handleInsertSlide}
          onAddCTA={handleAddCTA}
        />
        
        <footer className="mt-20 py-12 border-t border-white/5 text-center">
           <p className="text-gray-600 text-[10px] uppercase tracking-[0.3em] font-medium">{t.poweredBy}</p>
        </footer>
      </div>
    </div>
  );
};

export default App;