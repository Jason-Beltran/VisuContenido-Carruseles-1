import React, { useRef, useState } from 'react';
import { UserConfig, COLOR_PALETTES, TYPOGRAPHY_STYLES, DICTIONARY, VISUAL_STYLES } from '../types';
import { improveScriptWithAI } from '../services/geminiService';

interface InputSectionProps {
  config: UserConfig;
  setConfig: React.Dispatch<React.SetStateAction<UserConfig>>;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ config, setConfig, onGenerate, isGenerating }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [isCustomStyle, setIsCustomStyle] = useState(!VISUAL_STYLES.some(s => s.id === config.visualStyle));

  const t = DICTIONARY[config.language];
  const selectedStyleObj = VISUAL_STYLES.find(s => s.id === config.visualStyle);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'referenceImage' | 'styleReferenceImage' | 'logoImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImproveScript = async () => {
    if (!config.customScript || config.customScript.length < 10) return;
    setIsImproving(true);
    try {
      const improved = await improveScriptWithAI(config.customScript, config.profession, config.language);
      setConfig(prev => ({ ...prev, customScript: improved }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsImproving(false);
    }
  };

  const isReady = config.profession && (config.mode === 'topic' ? config.topic.length > 0 : config.customScript.length > 0);

  return (
    <div className="glass-card rounded-4xl p-6 sm:p-10 mb-8 shadow-glass relative overflow-hidden group">
      {/* Decorative Brand Accent Gradient */}
      <div 
        className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10 blur-[80px] pointer-events-none transition-all duration-700"
        style={{ backgroundColor: config.brandColor }}
      ></div>

      <h2 className="text-xl font-display font-bold text-white mb-8 tracking-widest flex items-center uppercase">
        <span 
          className="w-1.5 h-6 mr-4 transition-all duration-500 rounded-full" 
          style={{ backgroundColor: config.brandColor, boxShadow: `0 0 15px ${config.brandColor}` }}
        ></span>
        {t.configTitle}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Col: Strategy */}
        <div className="space-y-8">
          
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">{t.profession}</label>
            <input
              type="text"
              value={config.profession}
              onChange={(e) => setConfig({ ...config, profession: e.target.value })}
              placeholder="Ej. Filmmaker, Mentor, Coach"
              className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:outline-none transition-all focus:bg-white/10 focus:border-white/20 text-sm font-medium"
            />
          </div>

          <div className="bg-white/5 p-1 rounded-2xl flex space-x-1 border border-white/5">
            <button 
              onClick={() => setConfig({ ...config, mode: 'topic' })}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all
                ${config.mode === 'topic' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}
              `}
            >
              {t.modeTopic}
            </button>
            <button 
              onClick={() => setConfig({ ...config, mode: 'custom' })}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all
                ${config.mode === 'custom' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}
              `}
            >
              {t.modeCustom}
            </button>
          </div>

          {config.mode === 'topic' ? (
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">{t.topicLabel}</label>
              <input
                type="text"
                value={config.topic}
                onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                placeholder="Ej. Errores al grabar con celular"
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:outline-none transition-all focus:bg-white/10 focus:border-white/20 text-sm font-medium"
              />
            </div>
          ) : (
            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex justify-between">
                 <span>{t.scriptLabel}</span>
                 <span className="opacity-40">{t.scriptHint}</span>
               </label>
               <textarea
                 value={config.customScript}
                 onChange={(e) => setConfig({ ...config, customScript: e.target.value })}
                 placeholder="Escribe tu guion escena por escena..."
                 className="w-full h-32 bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:outline-none transition-all focus:bg-white/10 focus:border-white/20 text-sm font-medium resize-none"
               />
               <button
                 onClick={handleImproveScript}
                 disabled={isImproving || !config.customScript}
                 className="mt-3 w-full py-3 bg-visu-purple/10 border border-visu-purple/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-visu-purple/20 transition-all text-visu-purple-light flex items-center justify-center gap-2"
               >
                 {isImproving ? t.optimizing : t.improveBtn}
               </button>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">{t.visualStyle}</label>
            <div className="grid grid-cols-5 gap-3 mb-4">
              {VISUAL_STYLES.map(style => (
                 <button 
                   key={style.id}
                   onClick={() => { setConfig({...config, visualStyle: style.id}); setIsCustomStyle(false); }}
                   className={`p-3 border rounded-2xl flex flex-col items-center justify-center transition-all aspect-square
                     ${config.visualStyle === style.id && !isCustomStyle ? 'border-visu-purple bg-visu-purple/10 scale-105 shadow-lg shadow-visu-purple/20' : 'border-white/5 bg-white/5 hover:border-white/20'}
                   `}
                 >
                    <span className="text-xl mb-1">{style.icon}</span>
                    <span className="text-[7px] font-bold uppercase tracking-tighter opacity-80 text-center">{style.name[config.language]}</span>
                 </button>
              ))}
              <button 
                onClick={() => setIsCustomStyle(true)}
                className={`p-3 border rounded-2xl flex flex-col items-center justify-center transition-all aspect-square
                  ${isCustomStyle ? 'border-visu-purple bg-visu-purple/10' : 'border-white/5 bg-white/5 hover:border-white/20'}
                `}
              >
                 <span className="text-xl mb-1">✨</span>
                 <span className="text-[7px] font-bold uppercase tracking-tighter">{t.custom}</span>
              </button>
            </div>
            
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-gray-400 min-h-[60px] flex items-center">
              {isCustomStyle ? (
                <input
                  type="text"
                  value={VISUAL_STYLES.some(s => s.id === config.visualStyle) ? '' : config.visualStyle}
                  onChange={(e) => setConfig({ ...config, visualStyle: e.target.value })}
                  placeholder={t.customStylePlaceholder}
                  className="w-full bg-transparent border-none text-white focus:outline-none p-0"
                />
              ) : (
                <div className="leading-relaxed opacity-80 italic">"{selectedStyleObj?.description[config.language]}"</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Visuals & Brand */}
        <div className="space-y-8">
          
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">{t.refPerson}</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-40 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group
                  ${config.referenceImage ? 'border-white/30' : 'border-white/10 hover:border-white/20 bg-white/5'}
                `}
              >
                {config.referenceImage ? (
                  <>
                    <img src={config.referenceImage} alt="Ref" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold uppercase">{t.changePhoto}</div>
                  </>
                ) : (
                  <div className="text-center opacity-40 group-hover:opacity-60 transition-opacity">
                    <div className="text-2xl mb-1">📸</div>
                    <p className="text-[8px] font-bold tracking-widest">{t.clickUpload}</p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'referenceImage')} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Brand Logo</label>
              <div 
                onClick={() => logoInputRef.current?.click()}
                className={`w-full h-40 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group
                  ${config.logoImage ? 'border-white/30' : 'border-white/10 hover:border-white/20 bg-white/5'}
                `}
              >
                {config.logoImage ? (
                  <>
                    <img src={config.logoImage} alt="Logo" className="absolute inset-0 w-full h-full object-contain p-6" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold uppercase">Change</div>
                  </>
                ) : (
                  <div className="text-center opacity-40 group-hover:opacity-60 transition-opacity">
                    <div className="text-2xl mb-1">🏷️</div>
                     <p className="text-[8px] font-bold tracking-widest">{t.clickUpload}</p>
                  </div>
                )}
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logoImage')} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">{t.brandColor}</label>
            <div className="flex flex-wrap gap-3">
              {COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.hex}
                  onClick={() => setConfig({ ...config, brandColor: palette.hex })}
                  className={`w-8 h-8 rounded-full transition-all border-2
                    ${config.brandColor === palette.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-110'}
                  `}
                  style={{ backgroundColor: palette.hex, boxShadow: config.brandColor === palette.hex ? `0 0 15px ${palette.hex}80` : '' }}
                />
              ))}
              <div className="relative w-8 h-8 rounded-full border border-white/20 overflow-hidden flex items-center justify-center bg-white/10">
                 <input type="color" value={config.brandColor} onChange={(e) => setConfig({ ...config, brandColor: e.target.value })} className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0" />
                 <span className="text-[8px] font-bold opacity-40">MIX</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">{t.renderModeLabel}</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setConfig({...config, renderMode: 'overlay'})}
                className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-95
                  ${config.renderMode === 'overlay' ? 'border-white bg-white/10 shadow-aura' : 'border-white/5 bg-white/5 hover:border-white/10'}
                `}
              >
                <div className="text-[10px] font-bold text-white mb-1 uppercase tracking-widest">{t.renderOverlay}</div>
                <div className="text-[8px] text-gray-500 leading-tight">Texto nítido generado por sistema</div>
              </button>
              <button 
                onClick={() => setConfig({...config, renderMode: 'ai-baked'})}
                className={`p-4 rounded-2xl border text-left transition-all ai-aura hover:scale-[1.02] active:scale-95
                  ${config.renderMode === 'ai-baked' ? 'border-visu-purple bg-visu-purple/10' : 'border-white/5 bg-white/5 hover:border-white/10'}
                `}
              >
                <div className="text-[10px] font-bold text-visu-purple-light mb-1 uppercase tracking-widest">{t.renderBaked}</div>
                <div className="text-[8px] text-gray-500 leading-tight">Texto artístico integrado por IA</div>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
              <input 
                type="checkbox" 
                id="pageNumbers"
                checked={config.showPageNumbers}
                onChange={(e) => setConfig({...config, showPageNumbers: e.target.checked})}
                className="w-5 h-5 rounded-lg bg-black border-white/10 accent-visu-purple cursor-pointer"
              />
              <label htmlFor="pageNumbers" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer select-none">
                {t.pageNumbers}
              </label>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <button
          onClick={onGenerate}
          disabled={!isReady || isGenerating}
          className={`shimmer-btn w-full py-6 text-sm font-bold uppercase tracking-[0.4em] rounded-3xl transition-all shadow-premium border border-white/10
            ${!isReady 
              ? 'bg-white/5 text-gray-700 cursor-not-allowed border border-white/5 opacity-50' 
              : isGenerating
                ? 'bg-white/10 text-white animate-pulse'
                : 'text-white hover:brightness-110 hover:scale-[1.01] active:scale-[0.98] shadow-aura hover:shadow-aura-hover'
            }
          `}
          style={{ 
            backgroundColor: (!isReady || isGenerating) ? undefined : config.brandColor,
            boxShadow: (!isReady || isGenerating) ? undefined : `0 15px 30px ${config.brandColor}40`
          }}
        >
          {isGenerating ? t.generatingBtn : t.generateBtn}
        </button>
      </div>
    </div>
  );
};