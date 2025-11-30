
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SlidePlan, UserConfig, VISUAL_STYLES } from "../types";

/**
 * Helper: Improve Custom Script with AI
 */
export const improveScriptWithAI = async (currentScript: string, profession: string, language: 'en' | 'es'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  config: UserConfig
): Promise<SlidePlan[]> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isCustom = config.mode === 'custom';
  const isBaked = config.renderMode === 'ai-baked';

  const systemInstruction = `
    You are an expert Visual Director and Content Strategist for high-end social media.
    
    YOUR TASK:
    Create a JSON plan for a carousel.
    
    1. ANALYZE CONTENT COMPLEXITY (CRITICAL):
       - If the user provides a "Solution", "Process", or "List" with multiple steps/points:
         -> YOU MUST EXPAND to 8 or 10 slides.
         -> YOU MUST CREATE "INFOGRAPHIC SLIDES" for these dense parts.
       - If it is simple motivation: 6 Slides is fine.
    
    2. SLIDE STRUCTURE STRATEGY:
       - Slides 1-2: Hook & Problem (Emotional, Human).
       - Slides 3-7 (Middle): The "Value/Education". If this is a list of steps, use INFOGRAPHIC VISUALS (Charts, 3D Lists, Floating Interface). 
         -> **DO NOT cram detailed steps into one slide.** Split them up!
       - Final Slide: Call to Action.
    
    3. VISUAL DIRECTION RULES:
       - NO REPETITIVE POSES. Every slide must have a distinct Camera Angle and Pose.
       - USE VISUAL METAPHORS: If the script says "50 views", the image MUST show a phone with a low number graph. If it says "10k views", show a viral graph. If it says "Structure", show a blueprint/hologram.
       - CHARACTER PRESENCE (70/30 Rule):
         - For roughly 70% of slides (especially Hook, Connection, CTA), set "includeCharacter": true.
         - For roughly 30% of slides (especially Data, detailed Steps, Metaphors), set "includeCharacter": false to focus purely on the illustration/infographic.
    
    Output Language: ${config.language === 'es' ? 'Spanish' : 'English'}.
    Visual Style: "${config.visualStyle}".
    Brand Color: "${config.brandColor}".
    Render Mode: ${isBaked ? "FULL ARTWORK (Text/Lists baked into image)" : "OVERLAY (Clean background for CSS text)"}.
  `;

  let prompt = "";

  if (isCustom) {
    prompt = `
      Profession: ${config.profession}
      
      Based STRICTLY on the following script, generate the JSON plan.
      Adapt the script to 6, 8, or 10 slides. If the "Explanation" or "Solution" part is long, SPLIT IT into multiple illustrated slides.
      
      USER SCRIPT:
      ${config.customScript}
    `;
  } else {
    prompt = `
      Profession: ${config.profession}
      Topic: ${config.topic}
      
      Generate a viral carousel script (6, 8, or 10 slides) about this topic. 
      Ensure the middle section (Education) is detailed and visual.
    `;
  }

  prompt += `
    For each slide provide:
    1. "textOverlay": 
       - "headline": Main punchy text (Max 5 words).
       - "subheadline": Explanation (Max 12 words).
       - "tagline": Context label (e.g., "The Mistake", "Step 1").
    
    2. "visualMetaphor": A description of the SPECIFIC visual concept.
       - IF "includeCharacter" is FALSE: Describe a high-end 3D infographic, chart, or object illustrating the point.
       - IF "includeCharacter" is TRUE: Describe the person interacting with the concept.
    
    3. "imagePrompt": A highly detailed prompt for Gemini 3 Pro.
       - Start with "A ${config.visualStyle} shot...".
       - CAM ANGLES: Vary these! (Slide 1: Extreme Close Up. Slide 2: Wide Shot. Slide 3: Over the shoulder. Slide 4: Dutch Angle).
       - INFOGRAPHIC INSTRUCTIONS: If this is an educational step, include "Floating 3D list", "Holographic chart", or "Step-by-step diagram" in the prompt.
       ${isBaked 
         ? `- VITAL: This is 'AI-BAKED' mode. The image must contain the content.
            - If the slide implies a list, render a stylized 3D list in the air.
            - If it mentions a result (10k views), render that result visually in the scene.
            - The text "${isCustom ? 'USER HEADLINE' : 'HEADLINE'}" should be integrated (e.g. neon sign, movie poster title).` 
         : `- Ensure the subject is positioned to allow space for overlay text. Background clean in one area.`
       }
       - Lighting: Cinematic, featuring ${config.brandColor} accents.
       - ANTI-NEON: Unless the style is explicitly 'Cyberpunk' or 'Neon', DO NOT overuse neon lights. Use natural, studio, or dramatic lighting.
       
    4. "includeCharacter": Boolean. True if the main character (User) should be in the shot. False if it's a pure illustration/close-up.
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
 * Step 2: Generate a Single Image using the Reference
 */
export const generateSlideImage = async (
  plan: SlidePlan,
  referenceImageBase64: string,
  config: UserConfig
): Promise<string> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanBase64 = referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
  const isBaked = config.renderMode === 'ai-baked';

  // Resolve the visual style prompt.
  // If it matches a preset ID, use the detailed description. Otherwise use the raw string.
  const presetStyle = VISUAL_STYLES.find(s => s.id === config.visualStyle);
  const styleDescription = presetStyle ? presetStyle.description : config.visualStyle;

  let fullPrompt = "";

  if (isBaked) {
    // Pro Mode: Full Integration with NATIVE text
    fullPrompt = `
      GENERATE A MASTERPIECE VISUAL for a high-end social media carousel.
      
      CORE CONCEPT: ${plan.visualMetaphor}
      STYLE DEFINITION: ${styleDescription} (Strictly adhere to this aesthetic).
      
      SCENE DESCRIPTION: ${plan.imagePrompt}
      
      *** TEXT INTEGRATION (CRITICAL) ***
      The Headline text "${plan.textOverlay.headline}" MUST be NATIVELY INTEGRATED into the environment (Diegetic Text).
      It should NOT look like a digital overlay or sticker. It must be a physical part of the scene.
      
      INTEGRATION METHOD (Choose based on style '${config.visualStyle}'):
      - If 'Minimalist': Embossed text on a wall, printed on a book cover, clean 3D letters standing on a desk, or text on a smooth screen.
      - If 'Cinematic': Cinematic movie title typography floating in depth, projected light text on a surface, or backlit lettering.
      - If 'Urban': Graffiti art, poster on a wall, or billboard.
      - If 'Tech': Holographic interface, code on a monitor, or LED display.
      
      VISUAL COHERENCE:
      - The text must interact with the scene's lighting (casting shadows, reflecting environment).
      - Use depth of field to make the text feel embedded.
      - Color: Integrate ${config.brandColor} into the text or scene accents naturally.
      
      ANTI-NEON RULE:
      - Do NOT use 'Neon' styles unless the visual style explicitly requests it. 
      - If style is 'Professional' or 'Minimalist', use solid, clean materials for text (Plastic, Metal, Paint, Ink).
    `;
    
    // Character Logic
    if (plan.includeCharacter) {
      fullPrompt += `
        - The character (Reference Person) must be present.
        - The character should INTERACT with the text or data (looking at it, pointing, holding it).
      `;
    } else {
      fullPrompt += `
         - NO CHARACTER in this shot. Focus entirely on the illustration, infographic, object, or concept.
         - Make the composition powerful and graphic.
      `;
    }

  } else {
    // Overlay Mode: Clean Background
    fullPrompt = `
      Prompt: ${plan.imagePrompt}. 
      Visual Metaphor: ${plan.visualMetaphor}.
      Style Guidelines: ${styleDescription}.
      Color Palette: Dominant dark/neutral with accents of ${config.brandColor}.
      Quality: Hyper-realistic photography, 8k resolution, cinematic lighting.
      
      STRICT REQUIREMENT: 
      ${plan.includeCharacter ? "The person in the image must look exactly like the reference image provided." : "NO PERSON in this image. Focus on the object/concept/infographic."}
      
      CRITICAL: DO NOT include any text in the image. Keep the background clean/negative space for overlay text.
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

  // Add Logo if available
  if (config.logoImage) {
    const cleanLogoBase64 = config.logoImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    parts.push({
      text: "INCORPORATE THIS LOGO into the scene naturally (e.g. on a laptop sticker, mug, corner of a screen, or subtle background watermark). Do not make it huge."
    });
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanLogoBase64,
      },
    });
  }

  if (config.styleReferenceImage) {
    const cleanStyleBase64 = config.styleReferenceImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    parts.push({
      text: "Adopt the lighting, color grading, and composition style of this reference image:"
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
            aspectRatio: "3:4", 
            imageSize: "1K"
        }
      },
    });

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
