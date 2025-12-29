import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SlidePlan, UserConfig, VISUAL_STYLES } from "../types";

const getApiKey = () => {
  return process.env.API_KEY || localStorage.getItem('VISU_CREATOR_API_KEY') || "";
};

/**
 * Helper: Improve Custom Script with AI
 */
export const improveScriptWithAI = async (currentScript: string, profession: string, language: 'en' | 'es'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const systemInstruction = `
    You are a world-class copywriter for TikTok and Instagram Reels.
    Your goal is to take a rough script or idea and optimize it.
    
    CRITICAL: Analyze the content density.
    - If it's a simple tip: Create a 6-slide structure.
    - If it's a step-by-step guide or deep breakdown: Create an 8 or 10-slide structure.
    
    Output Language: ${language === 'es' ? 'Spanish' : 'English'}.
    Format: Scene-by-Scene text.
  `;

  const prompt = `
    Profession Context: ${profession}
    Original Draft: 
    "${currentScript}"

    Rewrite this into a powerful carousel script (6, 8, or 10 slides based on depth). 
    - Scene 1 must be a scroll-stopping hook.
    - The final Scene must be a clear Call to Action.
    - Make it sound human, conversational, yet authoritative.
    - Label them Slide 1, Slide 2, etc.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { systemInstruction },
    });
    return response.text || currentScript;
  } catch (error) {
    console.error("Improvement Error:", error);
    throw error;
  }
};

/**
 * Step 1: Generate the Text Plan (Prompts + Overlay Text Hierarchy)
 */
export const generateCarouselPlan = async (
  config: UserConfig,
  refinementPrompt?: string 
): Promise<SlidePlan[]> => {
  
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const isCustom = config.mode === 'custom';
  const isBaked = config.renderMode === 'ai-baked';
  
  const presetStyle = VISUAL_STYLES.find(s => s.id === config.visualStyle);
  const styleDesc = presetStyle ? presetStyle.description[config.language] : config.visualStyle;

  const systemInstruction = `
    You are an expert Visual Director and Content Strategist for high-end social media.
    
    YOUR TASK:
    Create a JSON plan for a carousel.
    
    1. ANALYZE CONTENT COMPLEXITY:
       - If steps are provided, expand to 8-10 slides.
    
    2. VISUAL DIRECTION RULES:
       - Vary camera angles.
       - Literal metaphors.
    
    Output Language: ${config.language === 'es' ? 'Spanish' : 'English'}.
    Visual Style: "${config.visualStyle}" (${styleDesc}).
    Brand Color: "${config.brandColor}".
    Render Mode: ${isBaked ? "FULL ARTWORK" : "OVERLAY"}.
  `;

  let prompt = "";
  if (isCustom) {
    prompt = `Profession: ${config.profession}. User Script: ${config.customScript}`;
  } else {
    prompt = `Profession: ${config.profession}. Topic: ${config.topic}`;
  }

  if (refinementPrompt) {
    prompt += `\nFEEDBACK: "${refinementPrompt}"`;
  }

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        textOverlay: { 
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            subheadline: { type: Type.STRING },
            tagline: { type: Type.STRING }
          },
          required: ["headline", "subheadline"]
        },
        visualMetaphor: { type: Type.STRING },
        imagePrompt: { type: Type.STRING },
        includeCharacter: { type: Type.BOOLEAN },
      },
      required: ["id", "textOverlay", "visualMetaphor", "imagePrompt", "includeCharacter"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as SlidePlan[];
  } catch (error) {
    console.error("Plan Generation Error:", error);
    throw error;
  }
};

/**
 * Step 1.5: Generate a Single Slide Plan
 */
export const generateSingleSlidePlan = async (
  config: UserConfig,
  instruction: string,
  slideContext: 'CTA' | 'INTERMEDIATE'
): Promise<SlidePlan> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.INTEGER },
      textOverlay: { 
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          subheadline: { type: Type.STRING },
          tagline: { type: Type.STRING }
        },
        required: ["headline", "subheadline"]
      },
      visualMetaphor: { type: Type.STRING },
      imagePrompt: { type: Type.STRING },
      includeCharacter: { type: Type.BOOLEAN },
    },
    required: ["textOverlay", "visualMetaphor", "imagePrompt", "includeCharacter"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Single slide: ${instruction}. Context: ${slideContext}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    
    const plan = JSON.parse(text) as SlidePlan;
    plan.id = Date.now();
    return plan;
  } catch (error) {
    throw error;
  }
};

/**
 * Step 2: Generate a Single Image
 */
export const generateSlideImage = async (
  plan: SlidePlan,
  referenceImageBase64: string | null,
  config: UserConfig,
  refinementPrompt?: string
): Promise<string> => {
  
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const isBaked = config.renderMode === 'ai-baked';
  const presetStyle = VISUAL_STYLES.find(s => s.id === config.visualStyle);
  const styleDescription = presetStyle ? presetStyle.description[config.language] : config.visualStyle;

  let fullPrompt = `Style: ${styleDescription}. Prompt: ${plan.imagePrompt}. Metaphor: ${plan.visualMetaphor}. Color: ${config.brandColor}. `;
  if (isBaked) fullPrompt += `NATIVELY INTEGRATE THIS TEXT: "${plan.textOverlay.headline}". `;
  if (refinementPrompt) fullPrompt += `REFINEMENT: ${refinementPrompt}. `;

  const parts: any[] = [{ text: fullPrompt }];

  if (referenceImageBase64 && plan.includeCharacter) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, ""),
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview", 
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: "3:4", imageSize: "1K" }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data");
  } catch (error) {
    throw error;
  }
};