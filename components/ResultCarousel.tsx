import React, { useState } from 'react';
import { GeneratedSlide, TYPOGRAPHY_STYLES, DICTIONARY, RenderMode } from '../types';

interface ResultCarouselProps {
  slides: GeneratedSlide[];
  brandColor: string;
  showPageNumbers: boolean;
  typographyId: string;
  language: 'en' | 'es';
  renderMode: RenderMode;
  onRegenerate: (slideId: number, refinementText?: string) => void;
  onRegenerateAll: (refinementText: string) => void;
  onInsertSlide: (index: number, instruction: string) => void;
  onAddCTA: (instruction: string) => void;
}

type ModalMode = 'regenerate' | 'regenerateAll' | 'insert' | 'cta' | null;

export const ResultCarousel: React.FC<ResultCarouselProps> = ({ 
  slides, 
  brandColor, 
  showPageNumbers, 
  typographyId, 
  language, 
  renderMode, 
  onRegenerate,
  onRegenerateAll,
  onInsertSlide,
  onAddCTA
}) => {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [activeSlideId, setActiveSlideId] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [inputText, setInputText] = useState("");

  if (slides.length === 0) return null;

  const t = DICTIONARY[language];
  const typo = TYPOGRAPHY_STYLES.find(t => t.id === typographyId) || TYPOGRAPHY_STYLES[0];
  const isBaked = renderMode === 'ai-baked';

  const getDynamicLayoutClasses = (headline: string, subheadline: string) => {
    const totalChars = (headline?.length || 0) + (subheadline?.length || 0);
    if (totalChars > 150) return { headline: "text-xl leading-tight mb-2", subheadline: "text-[10px] opacity-80", containerPadding: "p-6" };
    if (totalChars > 80) return { headline: "text-2xl leading-tight mb-3", subheadline: "text-xs opacity-90", containerPadding: "p-8" };
    return { headline: "text-4xl leading-[0.9] mb-4 uppercase", subheadline: "text-sm font-medium", containerPadding: "p-10" };
  };

  const handleConfirmAction = () => {
    if (modalMode === 'regenerate' && activeSlideId !== null) onRegenerate(activeSlideId, inputText);
    else if (modalMode === 'regenerateAll') onRegenerateAll(inputText);
    else if (modalMode === 'insert' && activeIndex !== null) onInsertSlide(activeIndex, inputText);
    else if (modalMode === 'cta') onAddCTA(inputText);
    setModalMode(null);
    setInputText("");
  };

  return (
    <div className="mt-20 relative pb-20">
      <h2 className="text-xl font-display font-bold text-white mb-10 tracking-[0.3em] flex items-center uppercase">
        <span 
          className="w-1.5 h-6 mr-4 transition-all duration-500 rounded-full" 
          style={{ backgroundColor: brandColor, boxShadow: `0 0 15px ${brandColor}` }}
        ></span>
        {t.results}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {slides.map((slide, index) => {
          const ds = getDynamicLayoutClasses(slide.textOverlay.headline, slide.textOverlay.subheadline);
          return (
            <div key={slide.id} className="relative aspect-[3/4] glass-card rounded-4xl overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-premium">
              {slide.status === 'generating' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-visu-black/60 backdrop-blur-xl z-30">
                  <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: brandColor, borderTopColor: 'transparent' }}></div>
                  <span className="font-bold text-[9px] uppercase tracking-[0.4em] animate-pulse" style={{ color: brandColor }}>{t.rendering}</span>
                </div>
              )}

              {slide.imageUrl && (
                <img src={slide.imageUrl} alt={`S${index}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" />
              )}

              {/* Interaction Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-60"></div>
              
              <div className={`absolute inset-0 z-20 flex flex-col justify-between ${ds.containerPadding} pointer-events-none`}>
                <div className="flex justify-between items-start w-full">
                  {!isBaked && slide.textOverlay.tagline && (
                    <span className="text-[8px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/5" style={{ color: brandColor }}>{slide.textOverlay.tagline}</span>
                  )}
                  {showPageNumbers && (
                    <span className="text-xl font-display font-bold text-white opacity-40 ml-auto">{index + 1}</span>
                  )}
                </div>

                <div className="mt-auto">
                  {!isBaked && (
                    <>
                      <h3 className={`${ds.headline} drop-shadow-2xl`} style={{ fontFamily: typo.fontFamilyDisplay }}>
                        {slide.textOverlay.headline.split(' ').map((w, i, a) => (
                           <span key={i} style={{ color: i === a.length - 1 ? brandColor : 'white' }}>{w} </span>
                        ))}
                      </h3>
                      <p className={`${ds.subheadline} tracking-tight leading-relaxed`} style={{ fontFamily: typo.fontFamilyBody }}>{slide.textOverlay.subheadline}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 z-40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col gap-2 scale-90 group-hover:scale-100">
                <button onClick={() => { setActiveSlideId(slide.id); setModalMode('regenerate'); setInputText(""); }} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                </button>
                <button onClick={() => { setActiveIndex(index); setModalMode('insert'); setInputText(""); }} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
              </div>

              {slide.imageUrl && slide.status === 'completed' && (
                <div className="absolute bottom-4 right-4 z-40 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <a href={slide.imageUrl} download={`slide-${index+1}.png`} className="bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all shadow-xl block">{t.download}</a>
                </div>
              )}
            </div>
          );
        })}

        <div onClick={() => { setModalMode('cta'); setInputText(""); }} className="aspect-[3/4] rounded-4xl border-2 border-dashed border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 flex flex-col items-center justify-center cursor-pointer transition-all group text-center p-8">
           <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🎯</span>
           </div>
           <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-2">{language === 'es' ? 'AGREGAR CTA' : 'ADD CTA'}</h3>
           <p className="text-[10px] text-gray-500 uppercase font-medium">{language === 'es' ? 'Cierra con impacto' : 'Close with impact'}</p>
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setModalMode(null)}></div>
          <div className="relative glass-card rounded-4xl p-8 w-full max-w-md shadow-premium border-white/10">
            <h3 className="text-2xl font-display font-bold mb-2 uppercase tracking-tight">{modalMode.replace(/([A-Z])/g, ' $1')}</h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">VisuContenido Creative Direction</p>
            <textarea className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-visu-purple focus:outline-none mb-6 min-h-[120px] resize-none" placeholder="..." value={inputText} onChange={(e) => setInputText(e.target.value)} autoFocus />
            <div className="flex gap-4">
              <button onClick={() => setModalMode(null)} className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleConfirmAction} className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-white rounded-2xl transition-all" style={{ backgroundColor: brandColor }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};