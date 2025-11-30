
import React, { useState, useEffect } from 'react';
import { UserConfig, GeneratedSlide, GenerationStep, COLOR_PALETTES, TYPOGRAPHY_STYLES, DICTIONARY, VISUAL_STYLES } from './types';
import { InputSection } from './components/InputSection';
import { ResultCarousel } from './components/ResultCarousel';
import { generateCarouselPlan, generateSlideImage } from './services/geminiService';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [config, setConfig] = useState<UserConfig>({
    profession: 'Filmmaker y Creador de Contenido',
    topic: 'Cómo debería verse tu negocio en redes',
    customScript: '',
    mode: 'topic',
    renderMode: 'overlay', // Default to clean overlay
    referenceImage: null,
    styleReferenceImage: null,
    brandColor: COLOR_PALETTES[0].hex, // Default Yellow
    visualStyle: VISUAL_STYLES[0].id, // Default to Cinematic
    typography: TYPOGRAPHY_STYLES[0].id,
    showPageNumbers: false,
    language: 'es'
  });

  const [slides, setSlides] = useState<GeneratedSlide[]>([]);
  const [step, setStep] = useState<GenerationStep>(GenerationStep.IDLE);
  const [error, setError] = useState<string | null>(null);

  const t = DICTIONARY[config.language];

  // Check for API key selection
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
      // 1. Generate Text Plan
      console.log("Generating plan...");
      const plan = await generateCarouselPlan(config);
      
      // Initialize slides in UI
      const initialSlides: GeneratedSlide[] = plan.map(p => ({
        ...p,
        status: 'pending'
      }));
      setSlides(initialSlides);
      setStep(GenerationStep.GENERATING_IMAGES);

      // 2. Generate Images Sequentially
      const updatedSlides = [...initialSlides];

      for (let i = 0; i < updatedSlides.length; i++) {
        setSlides(prev => prev.map(s => s.id === updatedSlides[i].id ? { ...s, status: 'generating' } : s));
        
        try {
          if (!config.referenceImage) throw new Error("Reference image lost");
          
          const imageUrl = await generateSlideImage(
            updatedSlides[i], 
            config.referenceImage,
            config
          );
          
          setSlides(prev => prev.map(s => s.id === updatedSlides[i].id ? { ...s, status: 'completed', imageUrl } : s));
        } catch (err: any) {
           console.error(`Error generating slide ${i+1}`, err);
           setSlides(prev => prev.map(s => s.id === updatedSlides[i].id ? { ...s, status: 'error', error: err.message || "Failed" } : s));
           
           // Check for missing key error
           if (err.message && err.message.includes("Requested entity was not found")) {
             setHasKey(false);
             setError("API Key session expired or invalid. Please select your key again.");
             if ((window as any).aistudio) {
               await (window as any).aistudio.openSelectKey();
             }
             return; 
           }
        }
      }

      setStep(GenerationStep.COMPLETED);

    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Requested entity was not found")) {
         setHasKey(false);
         if ((window as any).aistudio) {
            await (window as any).aistudio.openSelectKey();
         }
      }
      setError(err.message || "An unexpected error occurred.");
      setStep(GenerationStep.IDLE);
    }
  };

  if (!hasKey) {
     // Hardcoded fallback for pre-config load
     return (
        <div className="min-h-screen bg-visu-black text-white flex flex-col items-center justify-center p-4 text-center">
             <h1 className="text-4xl md:text-6xl mb-6 font-display font-bold uppercase tracking-tighter">
                Visu<span className="text-visu-accent">Creator</span>
             </h1>
             <p className="mb-8 text-gray-400 max-w-md">
               {config.language === 'en' 
                ? 'To use the high-quality image generation features (Gemini 3 Pro), please connect your Google Cloud API Key.' 
                : 'Para usar las funciones de generación de imágenes de alta calidad (Gemini 3 Pro), conecta tu Google Cloud API Key.'}
             </p>
             <button onClick={handleSelectKey} className="bg-visu-accent text-visu-black hover:bg-yellow-300 px-8 py-4 rounded font-bold uppercase tracking-wider transition-colors shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                Connect API Key
             </button>
             <div className="mt-8 text-gray-500 text-sm">
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-visu-accent">
                    Billing Documentation
                </a>
             </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-visu-black p-4 md:p-8 font-sans selection:bg-visu-accent selection:text-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 border-b border-white/10 pb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tighter">
              Visu<span style={{ color: config.brandColor }}>Creator</span>
            </h1>
            <p className="text-gray-400 mt-2 text-lg">
              AI-Powered Hyper-realistic Carousel Generator
            </p>
          </div>
          <div className="text-right">
             <span 
               className="text-xs font-bold uppercase border px-2 py-1 rounded bg-opacity-10"
               style={{ color: config.brandColor, borderColor: config.brandColor, backgroundColor: `${config.brandColor}20` }}
             >
               API Key Connected
             </span>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded mb-8 font-bold">
            {t.error}: {error}
          </div>
        )}

        {/* Main Interface */}
        <InputSection 
          config={config} 
          setConfig={setConfig} 
          onGenerate={handleGenerate}
          isGenerating={step !== GenerationStep.IDLE && step !== GenerationStep.COMPLETED}
        />

        {/* Progress Indicator */}
        {step === GenerationStep.PLANNING && (
           <div className="text-center py-12">
              <div 
                className="text-xl animate-pulse font-bold font-display uppercase"
                style={{ color: config.brandColor }}
              >
                {t.stepPlanning}
              </div>
           </div>
        )}

        {/* Results */}
        <ResultCarousel 
          slides={slides} 
          brandColor={config.brandColor} 
          showPageNumbers={config.showPageNumbers}
          typographyId={config.typography}
          language={config.language}
          renderMode={config.renderMode}
        />
        
        {/* Footer */}
        <footer className="mt-20 py-8 border-t border-white/5 text-center text-gray-600 text-sm">
           <p>{t.poweredBy}</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
