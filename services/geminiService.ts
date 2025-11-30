import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SlidePlan, UserConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper: Improve Custom Script with AI
 */
export const improveScriptWithAI = async (currentScript: string, profession: string, language: 'en' | 'es'): Promise<string> => {
  const systemInstruction = `
    You are a world-class copywriter for TikTok and Instagram Reels.
    Your goal is to take a rough script or idea and optimize it for:
    1. Psychological Hooks (Curiosity, Authority, Negativity Bias).
    2. Conciseness (Short, punchy sentences).
    3. Emotional Connection.
    
    Output Language: ${language === 'es' ? 'Spanish' : 'English'}.
    Format the output as a clean, scene-by-scene breakdown (6 Scenes).
    Do NOT output JSON. Output clear text that the user can edit.
  `;

  const prompt = `
    Profession Context: ${profession}
    Original Draft: 
    "${currentScript}"

    Rewrite this into a powerful 6-slide carousel script. 
    - Scene 1 must be a scroll-stopping hook.
    - Scene 6 must be a clear Call to Action.
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
  config: UserConfig
): Promise<SlidePlan[]> => {
  
  const isCustom = config.mode === 'custom';
  const isBaked = config.renderMode === 'ai-baked';

  const systemInstruction = `
    You are an expert visual director and copywriter for TikTok content.
    Your goal is to create a 6-slide educational/motivational carousel plan.
    Output Language: ${config.language === 'es' ? 'Spanish' : 'English'}.
    
    The user wants a visual style of: "${config.visualStyle}".
    The brand color accent is: "${config.brandColor}".
    The Text Rendering Mode is: ${isBaked ? "FULL ARTWORK (Text is part of the image)" : "OVERLAY (Clean image + CSS Text)"}.
    
    Structure:
    1. Hook (Slide 1)
    2. Problem/Context (Slide 2)
    3. Insight/Value (Slide 3)
    4. Actionable Tip (Slide 4)
    5. Result/Transformation (Slide 5)
    6. Call to Action (Slide 6)
  `;

  let prompt = "";

  if (isCustom) {
    prompt = `
      Profession: ${config.profession}
      
      Based STRICTLY on the following custom script/breakdown provided by the user, generate the JSON plan.
      Map the user's script to 6 slides.
      
      USER SCRIPT:
      ${config.customScript}
    `;
  } else {
    prompt = `
      Profession: ${config.profession}
      Topic: ${config.topic}
      
      Generate a viral 6-slide carousel script from scratch about this topic.
    `;
  }

  prompt += `
    For each slide provide:
    1. "textOverlay": An object containing the text content.
       - "headline": The main punchy text (Maximum 4-5 words).
       - "subheadline": Supporting text or explanation (Maximum 10-12 words).
       - "tagline": A tiny context label (e.g., "Slide 1", "Secret").
    
    2. "imagePrompt": A highly detailed prompt for an AI image generator. 
       - Start with "A ${config.visualStyle} image...".
       ${isBaked 
         ? `- VITAL: The visual must be a COMPLETE COMPOSITION. 
            - If the concept requires it, use 3D illustrations, metaphors, objects, or cinematic shots WITHOUT the main person. 
            - If using the person, integrate them deeply into the scene.
            - Explicitly describe how the text "${isCustom ? 'USER PROVIDED TEXT' : 'HEADLINE'}" is visually constructed (e.g. "The words 'STOP SCROLLING' are written in neon lights on a wet rainy street", "A giant 3D gold render of the word 'MONEY'", "A cinematic movie poster with the title 'THE TRUTH'").
            - The text MUST be legible and central to the composition.` 
         : `- Ensure the subject is positioned to allow space for overlay text. Keep the background relatively clean in one area.`
       }
       - Mention lighting/environment should feature ${config.brandColor}.
  `;

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
        imagePrompt: { type: Type.STRING },
      },
      required: ["id", "textOverlay", "imagePrompt"],
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
 * Step 2: Generate a Single Image using the Reference
 */
export const generateSlideImage = async (
  plan: SlidePlan,
  referenceImageBase64: string,
  config: UserConfig
): Promise<string> => {
  
  // Clean base64 header if present
  const cleanBase64 = referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
  const isBaked = config.renderMode === 'ai-baked';

  let fullPrompt = "";

  if (isBaked) {
    // Pro Mode: Full Integration
    fullPrompt = `
      GENERATE A COMPLETE POSTER/SLIDE IMAGE.
      Prompt: ${plan.imagePrompt}
      
      TEXT INSTRUCTION:
      - The text "${plan.textOverlay.headline}" MUST be part of the artwork.
      - Render the text "${plan.textOverlay.headline}" in a typography style matching: ${config.visualStyle}.
      - Also include the smaller text "${plan.textOverlay.subheadline}" if it fits naturally, otherwise focus on the headline.
      - Ensure spelling is perfect: "${plan.textOverlay.headline}".
      
      STYLE INSTRUCTION:
      - Visual Style: ${config.visualStyle}.
      - Color Palette: ${config.brandColor} accents.
      - Quality: Award-winning graphic design, 8k resolution.
      - COMPOSITION: The image should be ready to post. No need for external edits.
    `;
    
    // Only enforce the person reference if the prompt explicitly asks for a person/subject
    if (plan.imagePrompt.toLowerCase().includes('subject') || plan.imagePrompt.toLowerCase().includes('person') || plan.imagePrompt.toLowerCase().includes('man') || plan.imagePrompt.toLowerCase().includes('woman')) {
       fullPrompt += `
         - The character in the image must resemble the reference provided, but prioritize the overall artistic composition and text legibility.
       `;
    }
  } else {
    // Overlay Mode: Clean Background
    fullPrompt = `
      Prompt: ${plan.imagePrompt}. 
      Style: ${config.visualStyle}. 
      Color Palette: Dominant dark/neutral with accents of ${config.brandColor}.
      Quality: Hyper-realistic photography, 8k resolution, cinematic lighting.
      The person in the image must look exactly like the reference image provided.
      CRITICAL: DO NOT include any text in the image. Keep the background clean for overlay text.
    `;
  }

  const parts: any[] = [
    { text: fullPrompt },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanBase64,
      },
    }
  ];

  // Add Style Reference if available
  if (config.styleReferenceImage) {
    const cleanStyleBase64 = config.styleReferenceImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    parts.push({
      text: "STRICTLY FOLLOW THE VISUAL STYLE (Lighting, Composition, Color Grading, Font Style if visible) of the following reference image:"
    });
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanStyleBase64,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview", 
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
            aspectRatio: "3:4", // Standard carousel ratio
            imageSize: "1K"
        }
      },
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};