import React, { useState, useEffect } from 'react';
import { UserConfig, GeneratedSlide, GenerationStep, COLOR_PALETTES, TYPOGRAPHY_STYLES, DICTIONARY, VISUAL_STYLES } from './types';
import { InputSection } from './components/InputSection';
import { ResultCarousel } from './components/ResultCarousel';
import { generateCarouselPlan, generateSlideImage, generateSingleSlidePlan } from './services/geminiService';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
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

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio && await (window as any).aistudio.hasSelectedApiKey()) {
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
        setHasKey(true);
    }
  };

  const handleGenerate = async () => {
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
           setSlides(prev => prev.map(s => s.id === initialSlides[i].id ? { ...s, status: 'error', error: err.message || "Failed" } : s));
           if (err.message && err.message.includes("Requested entity was not found")) {
             setHasKey(false);
             setError("Sesión expirada. Conecta de nuevo tu Key.");
             return; 
           }
        }
      }
      setStep(GenerationStep.COMPLETED);
    } catch (err: any) {
      setError(err.message || "Error inesperado.");
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
       setSlides(prev => prev.map(s => s.id === slideId ? { ...s, status: 'error', error: err.message } : s));
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
           setSlides(prev => prev.map(s => s.id === initialSlides[i].id ? { ...s, status: 'error', error: err.message } : s));
        }
      }
      setStep(GenerationStep.COMPLETED);
    } catch (err: any) {
      setError(err.message);
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
             <div className="mb-12 relative">
                <div className="absolute -inset-10 bg-visu-purple/20 blur-3xl rounded-full float-anim"></div>
                <h1 className="text-5xl md:text-8xl font-display font-bold uppercase tracking-tighter relative">
                   Visu<span className="text-visu-purple">Creator</span>
                </h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest mt-2">By VisuContenido</p>
             </div>

             <div className="max-w-xl glass-card rounded-4xl p-8 mb-8 text-left shadow-premium border-visu-purple/20">
               <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                 <span className="w-8 h-8 rounded-full bg-visu-purple flex items-center justify-center text-sm">1</span>
                 Conecta tu Cerebro IA
               </h2>
               <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                 Esta aplicación utiliza <strong>Gemini 3 Pro</strong> para generar imágenes de nivel cinematográfico. Para que funcione, necesitas usar tu propia API Key de Google.
               </p>
               
               <div className="space-y-4 mb-8">
                 <div className="flex gap-4">
                   <div className="text-visu-purple font-mono text-lg">01.</div>
                   <p className="text-xs text-gray-300">Ve a <a href="https://ai.google.dev/" target="_blank" className="underline text-visu-purple">Google AI Studio</a> y crea una Key gratuita o de pago.</p>
                 </div>
                 <div className="flex gap-4">
                   <div className="text-visu-purple font-mono text-lg">02.</div>
                   <p className="text-xs text-gray-300">Asegúrate de tener un proyecto en Google Cloud habilitado.</p>
                 </div>
                 <div className="flex gap-4">
                   <div className="text-visu-purple font-mono text-lg">03.</div>
                   <p className="text-xs text-gray-300">Haz clic en el botón de abajo y selecciona tu Key en la ventana emergente.</p>
                 </div>
               </div>

               <button 
                 onClick={handleSelectKey} 
                 className="w-full bg-visu-purple text-white hover:bg-visu-purple-light px-8 py-5 rounded-3xl font-bold uppercase tracking-wider transition-all shadow-xl hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                  </svg>
                  Conectar Key de AI Studio
               </button>
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
          <div className="relative">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tighter">
              Visu<span style={{ color: config.brandColor }}>Creator</span>
            </h1>
            <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">
              By VisuContenido
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-[9px] uppercase font-bold text-gray-500 mb-1">Status</span>
                <span className="text-[10px] font-bold uppercase py-1 px-3 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                  AI Active
                </span>
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
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-3xl mb-8 font-medium backdrop-blur-md animate-fade-in flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-red-500"></div>
             {t.error}: {error}
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
              <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mb-6" style={{ borderColor: config.brandColor, borderTopColor: 'transparent' }}></div>
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