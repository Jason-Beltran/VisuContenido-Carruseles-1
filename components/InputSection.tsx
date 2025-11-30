
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
      alert("Could not improve script. Please try again.");
    } finally {
      setIsImproving(false);
    }
  };

  // Ready if profession is set AND either topic or script is present. Reference image is now optional.
  const isReady = config.profession && (config.mode === 'topic' ? config.topic.length > 0 : config.customScript.length > 0);

  return (
    <div className="bg-visu-gray border border-white/10 rounded-xl p-6 mb-8 shadow-2xl relative">
      
      {/* Language Toggle */}
      <div className="absolute top-6 right-6 flex gap-2 z-10">
         <button 
           onClick={() => setConfig({...config, language: 'en'})}
           className={`text-xs font-bold px-2 py-1 rounded ${config.language === 'en' ? 'bg-white text-black' : 'text-gray-500'}`}
         >
           EN
         </button>
         <button 
           onClick={() => setConfig({...config, language: 'es'})}
           className={`text-xs font-bold px-2 py-1 rounded ${config.language === 'es' ? 'bg-white text-black' : 'text-gray-500'}`}
         >
           ES
         </button>
      </div>

      <h2 className="text-xl font-display font-bold text-white mb-6 tracking-wide flex items-center">
        <span 
          className="w-2 h-8 mr-3 transition-colors duration-300" 
          style={{ backgroundColor: config.brandColor }}
        ></span>
        {t.configTitle}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Col: Content Strategy */}
        <div className="space-y-6">
          
          {/* Profession */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.profession}</label>
            <input
              type="text"
              value={config.profession}
              onChange={(e) => setConfig({ ...config, profession: e.target.value })}
              placeholder="e.g. Filmmaker, Neuroscientist, Chef"
              className="w-full bg-visu-black border border-white/20 rounded p-3 text-white focus:outline-none transition-colors focus:border-white/50"
            />
          </div>

          {/* Mode Switcher */}
          <div className="bg-visu-black p-1 rounded-lg flex space-x-1 border border-white/10">
            <button 
              onClick={() => setConfig({ ...config, mode: 'topic' })}
              className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded transition-all
                ${config.mode === 'topic' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}
              `}
            >
              {t.modeTopic}
            </button>
            <button 
              onClick={() => setConfig({ ...config, mode: 'custom' })}
              className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded transition-all
                ${config.mode === 'custom' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}
              `}
            >
              {t.modeCustom}
            </button>
          </div>

          {/* Dynamic Input based on Mode */}
          {config.mode === 'topic' ? (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.topicLabel}</label>
              <input
                type="text"
                value={config.topic}
                onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                placeholder="e.g. How to structure a viral video"
                className="w-full bg-visu-black border border-white/20 rounded p-3 text-white focus:outline-none transition-colors focus:border-white/50"
              />
            </div>
          ) : (
            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex justify-between items-center">
                 <span>{t.scriptLabel}</span>
                 <span className="text-[10px] text-gray-500 hidden sm:inline">{t.scriptHint}</span>
               </label>
               <textarea
                 value={config.customScript}
                 onChange={(e) => setConfig({ ...config, customScript: e.target.value })}
                 placeholder="Scene 1: Me holding a camera... &#10;Scene 2: Showing a laptop screen..."
                 className="w-full h-32 bg-visu-black border border-white/20 rounded p-3 text-white focus:outline-none transition-colors focus:border-white/50 text-sm font-mono"
               />
               <button
                 onClick={handleImproveScript}
                 disabled={isImproving || !config.customScript}
                 className="mt-2 w-full py-2 bg-gradient-to-r from-purple-900 to-blue-900 border border-white/10 rounded text-xs font-bold uppercase tracking-wider hover:from-purple-800 hover:to-blue-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
               >
                 {isImproving ? t.optimizing : t.improveBtn}
               </button>
            </div>
          )}

          <div className="h-px bg-white/10 my-4"></div>

          {/* Render Mode Toggle (New Feature) */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t.renderModeLabel}</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setConfig({...config, renderMode: 'overlay'})}
                className={`p-3 rounded border text-left transition-all relative overflow-hidden
                  ${config.renderMode === 'overlay' ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/30'}
                `}
              >
                <div className="text-sm font-bold text-white mb-1">{t.renderOverlay}</div>
                <div className="text-[10px] text-gray-400">Basic: Image + CSS Text Overlay</div>
                {config.renderMode === 'overlay' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400"></div>}
              </button>

              <button 
                onClick={() => setConfig({...config, renderMode: 'ai-baked'})}
                className={`p-3 rounded border text-left transition-all relative overflow-hidden
                  ${config.renderMode === 'ai-baked' ? 'border-purple-400 bg-purple-900/20' : 'border-white/10 hover:border-white/30'}
                `}
              >
                <div className="text-sm font-bold text-purple-300 mb-1 flex items-center gap-2">
                  {t.renderBaked}
                  <span className="text-[8px] bg-purple-500 text-black px-1 rounded font-bold">PRO</span>
                </div>
                <div className="text-[10px] text-gray-400">PRO: Full Image + Integrated Text</div>
                {config.renderMode === 'ai-baked' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-400"></div>}
              </button>
            </div>
          </div>


          {/* Visual Style Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t.visualStyle}</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {VISUAL_STYLES.map(style => (
                 <button 
                   key={style.id}
                   onClick={() => {
                     setConfig({...config, visualStyle: style.id});
                     setIsCustomStyle(false);
                   }}
                   className={`p-2 border rounded flex flex-col items-center justify-center text-center transition-all h-20
                     ${config.visualStyle === style.id && !isCustomStyle ? 'border-visu-accent bg-white/5' : 'border-white/10 hover:border-white/30'}
                   `}
                 >
                    <span className="text-xl mb-1">{style.icon}</span>
                    <span className="text-[10px] font-bold leading-tight">{style.name}</span>
                 </button>
              ))}
              <button 
                onClick={() => setIsCustomStyle(true)}
                className={`p-2 border rounded flex flex-col items-center justify-center text-center transition-all h-20
                  ${isCustomStyle ? 'border-visu-accent bg-white/5' : 'border-white/10 hover:border-white/30'}
                `}
              >
                 <span className="text-xl mb-1">✨</span>
                 <span className="text-[10px] font-bold leading-tight">{t.custom}</span>
              </button>
            </div>
            
            {/* Custom Style Input */}
            {isCustomStyle && (
              <input
                type="text"
                value={VISUAL_STYLES.some(s => s.id === config.visualStyle) ? '' : config.visualStyle}
                onChange={(e) => setConfig({ ...config, visualStyle: e.target.value })}
                placeholder={t.customStylePlaceholder}
                className="w-full bg-visu-black border border-white/20 rounded p-3 text-white focus:outline-none transition-colors focus:border-white/50 text-sm animate-fade-in"
              />
            )}
          </div>

          {/* Typography Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t.typography}</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPOGRAPHY_STYLES.map(style => (
                 <button
                   key={style.id}
                   onClick={() => setConfig({...config, typography: style.id})}
                   className={`p-3 border rounded text-left transition-all ${config.typography === style.id ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/30'} ${config.renderMode === 'ai-baked' ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                    <div style={{ fontFamily: style.fontFamilyDisplay }} className="text-lg leading-none mb-1 text-white">{style.name}</div>
                    <div style={{ fontFamily: style.fontFamilyBody }} className="text-[10px] text-gray-400">Aa Bb Cc 123</div>
                 </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Col: Branding & Visuals */}
        <div className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
             {/* Reference Image (Person) */}
             <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.refPerson} (Optional)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group
                  ${config.referenceImage ? 'border-white/50' : 'border-white/20 hover:border-white/50'}
                `}
              >
                {config.referenceImage ? (
                  <>
                    <img 
                      src={config.referenceImage} 
                      alt="Reference" 
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" 
                    />
                    <div 
                      className="z-10 bg-black/80 p-2 rounded text-[10px] font-bold uppercase text-center"
                      style={{ color: config.brandColor }}
                    >
                      {t.changePhoto}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2">
                    <div className="text-xl mb-1 text-gray-500">👤</div>
                    <p className="text-[10px] text-gray-400 font-bold leading-tight">{t.clickUpload}</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'referenceImage')}
                />
              </div>
            </div>

            {/* Logo Upload (NEW) */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">LOGO (Optional)</label>
              <div 
                onClick={() => logoInputRef.current?.click()}
                className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group
                  ${config.logoImage ? 'border-white/50' : 'border-white/20 hover:border-white/50'}
                `}
              >
                {config.logoImage ? (
                  <>
                    <img 
                      src={config.logoImage} 
                      alt="Logo" 
                      className="absolute inset-0 w-full h-full object-contain p-4 opacity-80 group-hover:opacity-60 transition-opacity" 
                    />
                     <div 
                      className="z-10 bg-black/80 p-2 rounded text-[10px] font-bold uppercase text-center"
                      style={{ color: config.brandColor }}
                    >
                      Change Logo
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2">
                    <div className="text-xl mb-1 text-gray-500">🛡️</div>
                     <p className="text-[10px] text-gray-400 font-bold leading-tight">{t.clickUpload}</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={logoInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'logoImage')}
                />
              </div>
            </div>

            {/* Style Reference (Optional) */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.refStyle}</label>
              <div 
                onClick={() => styleInputRef.current?.click()}
                className={`w-full h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group
                  ${config.styleReferenceImage ? 'border-white/50' : 'border-white/20 hover:border-white/50'}
                `}
              >
                {config.styleReferenceImage ? (
                  <>
                    <img 
                      src={config.styleReferenceImage} 
                      alt="Style Ref" 
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" 
                    />
                     <div 
                      className="z-10 bg-black/80 p-2 rounded text-[10px] font-bold uppercase text-center"
                      style={{ color: config.brandColor }}
                    >
                      {t.changePhoto}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2 flex items-center gap-2">
                    <div className="text-xl text-gray-500">🎨</div>
                     <p className="text-[10px] text-gray-400 font-bold leading-tight">{t.clickUpload} (Optional)</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={styleInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'styleReferenceImage')}
                />
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t.brandColor}</label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.hex}
                  onClick={() => setConfig({ ...config, brandColor: palette.hex })}
                  className={`h-8 rounded flex items-center justify-center transition-all border
                    ${config.brandColor === palette.hex ? 'border-white scale-110 ring-2 ring-white/20' : 'border-transparent hover:scale-105'}
                  `}
                  style={{ backgroundColor: palette.hex }}
                  title={palette.name}
                >
                  {config.brandColor === palette.hex && <span className="text-black text-[10px]">✓</span>}
                </button>
              ))}
              <div className="relative h-8 rounded border border-white/20 overflow-hidden flex items-center justify-center bg-visu-black">
                 <input 
                   type="color" 
                   value={config.brandColor}
                   onChange={(e) => setConfig({ ...config, brandColor: e.target.value })}
                   className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer opacity-0"
                 />
                 <span className="text-[10px] text-gray-400">CUSTOM</span>
              </div>
            </div>
          </div>

           {/* Page Numbers Toggle */}
           <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="pageNumbers"
                checked={config.showPageNumbers}
                onChange={(e) => setConfig({...config, showPageNumbers: e.target.checked})}
                className="w-4 h-4 rounded border-gray-600 bg-visu-black accent-current"
                style={{ color: config.brandColor }}
              />
              <label htmlFor="pageNumbers" className="text-xs font-bold text-gray-400 uppercase cursor-pointer select-none">
                {t.pageNumbers}
              </label>
           </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-8">
        <button
          onClick={onGenerate}
          disabled={!isReady || isGenerating}
          className={`w-full py-4 text-lg font-display font-bold uppercase tracking-wider rounded transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]
            ${!isReady 
              ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
              : isGenerating
                ? 'bg-white/10 text-white animate-pulse cursor-wait'
                : 'text-visu-black hover:brightness-110'
            }
          `}
          style={{ 
            backgroundColor: (!isReady || isGenerating) ? undefined : config.brandColor,
            boxShadow: (!isReady || isGenerating) ? undefined : `0 0 20px ${config.brandColor}40`
          }}
        >
          {isGenerating ? t.generatingBtn : t.generateBtn}
        </button>
      </div>
    </div>
  );
};
