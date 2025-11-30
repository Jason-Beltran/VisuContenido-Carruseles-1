
import React from 'react';
import { GeneratedSlide, TYPOGRAPHY_STYLES, DICTIONARY, RenderMode } from '../types';

interface ResultCarouselProps {
  slides: GeneratedSlide[];
  brandColor: string;
  showPageNumbers: boolean;
  typographyId: string;
  language: 'en' | 'es';
  renderMode: RenderMode;
}

export const ResultCarousel: React.FC<ResultCarouselProps> = ({ slides, brandColor, showPageNumbers, typographyId, language, renderMode }) => {
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

  return (
    <div className="mt-12">
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

              {/* UI Overlay (Buttons/Badges) - Only UI, no Content Text if Baked */}
              <div className={`absolute inset-0 flex flex-col justify-between z-20 pointer-events-none ${dynamicStyles.containerPadding}`}>
                
                {/* Only show gradient in Overlay Mode to make text readable */}
                {!isBaked && (
                   <div className="absolute inset-0 bg-gradient-to-t -z-10 from-black/95 via-black/10 to-black/30"></div>
                )}

                {/* Top Section */}
                <div className="w-full">
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
                <div className="mt-auto mb-2 max-w-[95%]">
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
                    className="px-4 py-2 rounded font-bold text-xs uppercase text-black hover:text-black hover:brightness-110 transition-all pointer-events-auto shadow-lg"
                    style={{ backgroundColor: brandColor }}
                  >
                    {t.download}
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
