
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
}

export const ResultCarousel: React.FC<ResultCarouselProps> = ({ slides, brandColor, showPageNumbers, typographyId, language, renderMode, onRegenerate }) => {
  const [editingSlideId, setEditingSlideId] = useState<number | null>(null);
  const [refinementText, setRefinementText] = useState("");

  if (slides.length === 0) return null;

  const t = DICTIONARY[language];
  const typo = TYPOGRAPHY_STYLES.find(t => t.id === typographyId) || TYPOGRAPHY_STYLES[0];
  const isBaked = renderMode === 'ai-baked';

  // Helper to determine font scaling based on text density
  const getDynamicLayoutClasses = (headline: string, subheadline: string) => {
    const totalChars = (headline?.length || 0) + (subheadline?.length || 0);
    
    // Default (Short/Impactful)
    let styles = {
      headline: "text-4xl md:text-5xl leading-[0.85] mb-4",
      subheadline: "text-sm opacity-90 leading-tight",
      containerPadding: "p-6"
    };

    // Medium Density
    if (totalChars > 80 && totalChars <= 150) {
      styles = {
        headline: "text-2xl md:text-4xl leading-tight mb-3",
        subheadline: "text-xs md:text-sm opacity-90 leading-snug",
        containerPadding: "p-5"
      };
    }
    // High Density (Avoid covering image)
    else if (totalChars > 150) {
      styles = {
        headline: "text-xl md:text-2xl leading-tight mb-2",
        subheadline: "text-[10px] md:text-xs opacity-90 leading-snug",
        containerPadding: "p-4"
      };
    }

    return styles;
  };

  const openRegenerateModal = (id: number) => {
    setEditingSlideId(id);
    setRefinementText("");
  };

  const handleConfirmRegenerate = () => {
    if (editingSlideId !== null) {
      onRegenerate(editingSlideId, refinementText);
      setEditingSlideId(null);
      setRefinementText("");
    }
  };

  return (
    <div className="mt-12 relative">
      <h2 className="text-xl font-display font-bold text-white mb-6 tracking-wide flex items-center">
        <span 
          className="w-2 h-8 mr-3 transition-colors duration-300" 
          style={{ backgroundColor: brandColor }}
        ></span>
        {t.results} ({slides.length} Slides)
      </h2>

      {/* Responsive Grid that handles 6, 8, or 10 slides well */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {slides.map((slide, index) => {
          const dynamicStyles = getDynamicLayoutClasses(slide.textOverlay.headline, slide.textOverlay.subheadline);

          return (
            <div key={slide.id} className="relative aspect-[3/4] bg-visu-gray rounded-lg overflow-hidden border border-white/10 group">
              
              {/* Status Layers */}
              {slide.status === 'pending' && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-display text-sm uppercase tracking-widest">
                  Pending...
                </div>
              )}
              
              {slide.status === 'generating' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-visu-black/50 backdrop-blur-sm z-10">
                  <div 
                    className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-4"
                    style={{ borderColor: brandColor, borderTopColor: 'transparent' }}
                  ></div>
                  <span 
                    className="font-bold text-xs uppercase tracking-widest"
                    style={{ color: brandColor }}
                  >
                    {t.rendering}
                  </span>
                </div>
              )}

              {slide.status === 'error' && (
                 <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 text-red-400 p-4 text-center text-sm">
                   {slide.error || "Generation Failed"}
                   <button 
                     onClick={() => openRegenerateModal(slide.id)}
                     className="mt-2 text-xs font-bold underline"
                   >
                     Retry
                   </button>
                 </div>
              )}

              {/* Image Layer */}
              {slide.imageUrl && (
                <img 
                  src={slide.imageUrl} 
                  alt={`Slide ${slide.id}`} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}

              {/* Action Buttons (Hover) - Top Right */}
              <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                 {/* Regenerate Button */}
                 {(slide.status === 'completed' || slide.status === 'error') && (
                    <button
                      onClick={() => openRegenerateModal(slide.id)}
                      className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all border border-white/20 shadow-lg"
                      title={language === 'es' ? 'Regenerar con ajustes' : 'Regenerate with feedback'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    </button>
                 )}
              </div>

              {/* UI Overlay (Buttons/Badges) - Only UI, no Content Text if Baked */}
              <div className={`absolute inset-0 flex flex-col justify-between z-20 pointer-events-none ${dynamicStyles.containerPadding}`}>
                
                {/* Only show gradient in Overlay Mode to make text readable */}
                {!isBaked && (
                   <div className="absolute inset-0 bg-gradient-to-t -z-10 from-black/95 via-black/10 to-black/30"></div>
                )}

                {/* Top Section */}
                <div className="w-full pointer-events-none">
                  {/* Progress Bar - Always Visible */}
                  <div className="w-full h-1 bg-white/20 mb-4 rounded-full overflow-hidden">
                     <div 
                       className="h-full transition-all duration-300" 
                       style={{ width: `${(slide.id / slides.length) * 100}%`, backgroundColor: brandColor }}
                     ></div>
                  </div>

                  {/* Page Number / Tagline */}
                  <div className="flex justify-between items-start">
                     {/* Only show tagline if OVERLAY mode. In Baked mode, context should be in image. */}
                     {!isBaked && slide.textOverlay.tagline && (
                        <span 
                          className="text-[10px] font-bold uppercase tracking-widest py-1 px-2 rounded bg-black/40 backdrop-blur-md"
                          style={{ fontFamily: typo.fontFamilyBody, color: brandColor }}
                        >
                          {slide.textOverlay.tagline}
                        </span>
                     )}
                     
                     {showPageNumbers && (
                      <span 
                        className="text-lg font-bold opacity-80 drop-shadow-md ml-auto"
                        style={{ fontFamily: typo.fontFamilyDisplay, color: '#fff' }}
                      >
                        {index + 1}
                      </span>
                     )}
                  </div>
                </div>

                {/* Bottom Section - Content Text */}
                <div className="mt-auto mb-2 max-w-[95%] pointer-events-none">
                  {/* 
                     RENDER MODE LOGIC:
                     If 'ai-baked': HIDE ALL HTML TEXT. The image contains everything.
                     If 'overlay': Show HTML Headline + Subheadline.
                  */}
                  
                  {!isBaked && (
                    <>
                      <h3 
                        className={`${dynamicStyles.headline} uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]`}
                        style={{ fontFamily: typo.fontFamilyDisplay, color: '#ffffff' }}
                      >
                        {/* Highlight logic: Last word */}
                        {slide.textOverlay.headline.split(' ').map((word, i, arr) => {
                           const isHighlight = i === arr.length - 1 && arr.length > 2; 
                           return (
                             <span key={i} style={{ color: isHighlight ? brandColor : 'inherit' }}>{word} </span>
                           )
                        })}
                      </h3>

                      <p 
                        className={`${dynamicStyles.subheadline} drop-shadow-md`}
                        style={{ fontFamily: typo.fontFamilyBody }}
                      >
                        {slide.textOverlay.subheadline}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Download Button (Hover) */}
              {slide.status === 'completed' && slide.imageUrl && (
                <div className="absolute bottom-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a 
                    href={slide.imageUrl} 
                    download={`slide-${slide.id}.png`}
                    className="px-4 py-2 rounded font-bold text-xs uppercase text-black hover:text-black hover:brightness-110 transition-all pointer-events-auto shadow-lg flex items-center gap-2"
                    style={{ backgroundColor: brandColor }}
                  >
                    <span>{t.download}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Regeneration Modal */}
      {editingSlideId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingSlideId(null)}></div>
          <div className="relative bg-visu-gray border border-white/20 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-display font-bold text-white mb-2 uppercase">
              {language === 'es' ? 'Regenerar Slide' : 'Regenerate Slide'}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
               {language === 'es' 
                 ? '¿Qué quieres cambiar? (Ej: "Hazlo más brillante", "Quita la laptop", "Mejora el rostro")' 
                 : 'What would you like to change? (e.g. "Make it brighter", "Remove laptop", "Fix face")'}
            </p>
            
            <textarea
              className="w-full bg-visu-black border border-white/10 rounded p-3 text-white text-sm focus:border-white/50 focus:outline-none mb-4 min-h-[100px]"
              placeholder={language === 'es' ? 'Describe los cambios...' : 'Describe changes...'}
              value={refinementText}
              onChange={(e) => setRefinementText(e.target.value)}
              autoFocus
            />

            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setEditingSlideId(null)}
                className="px-4 py-2 rounded text-xs font-bold uppercase text-gray-400 hover:text-white transition-colors"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button 
                onClick={handleConfirmRegenerate}
                className="px-6 py-2 rounded text-xs font-bold uppercase text-visu-black transition-colors"
                style={{ backgroundColor: brandColor }}
              >
                {language === 'es' ? 'Confirmar' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
