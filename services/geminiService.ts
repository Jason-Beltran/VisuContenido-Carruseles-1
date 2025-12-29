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
  config: UserConfig,
  refinementPrompt?: string // NEW: Optional user feedback for re-planning
): Promise<SlidePlan[]> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isCustom = config.mode === 'custom';
  const isBaked = config.renderMode === 'ai-baked';
  
  // Resolve style description for the plan generator to understand the vibe
  const presetStyle = VISUAL_STYLES.find(s => s.id === config.visualStyle);
  const styleDesc = presetStyle ? presetStyle.description[config.language] : config.visualStyle;

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
       - USE LITERAL VISUAL METAPHORS: 
         - **CRITICAL**: The image MUST explain the text. 
         - If text says "50 views", show a phone with a red line graph going down. 
         - If text says "Structure", show a blueprint, scaffold, or 3D wireframe.
         - If text says "Growth", show a green arrow going up or a plant growing from money.
         - DO NOT simply describe "A person looking serious". Describe the OBJECTS that explain the concept.
       
       - CHARACTER PRESENCE (65/35 Rule):
         - For roughly 65% of slides (Hook, Connection, CTA), set "includeCharacter": true.
         - For roughly 35% of slides (Deep Education, Data, Specific Steps), set "includeCharacter": false. Prioritize the infographic/illustration.
    
    Output Language: ${config.language === 'es' ? 'Spanish' : 'English'}.
    Visual Style: "${config.visualStyle}" (${styleDesc}).
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

  // --- REFINEMENT LOGIC ---
  if (refinementPrompt) {
    prompt += `
    
    *** IMPORTANT: USER REGENERATION REQUEST ***
    The user wants to RE-GENERATE this plan because they were unhappy with the previous result.
    FEEDBACK: "${refinementPrompt}"
    
    - If they say "it was too short", add more slides.
    - If they say "explanations were weak", make the visual metaphors more literal (charts/diagrams).
    - If they say "change the tone", adjust the headlines.
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
       - **ILLUSTRATE THE VALUE**: The prompt MUST describe the "subheadline" concept visually. If the text says "Write a script", the prompt MUST contain "A messy notebook with handwritten notes". If it says "Lighting", show a softbox light.
       ${isBaked 
         ? `- VITAL: This is 'AI-BAKED' mode. The image must contain the content.
            - If the slide implies a list, render a stylized 3D list in the air.
            - If it mentions a result (10k views), render that result visually in the scene.
            - The text integration should be diegetic.` 
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
 * Step 1.5: Generate a Single Slide Plan (For insertion or CTA)
 */
export const generateSingleSlidePlan = async (
  config: UserConfig,
  instruction: string,
  slideContext: 'CTA' | 'INTERMEDIATE'
): Promise<SlidePlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isBaked = config.renderMode === 'ai-baked';
  const presetStyle = VISUAL_STYLES.find(s => s.id === config.visualStyle);
  const styleDesc = presetStyle ? presetStyle.description[config.language] : config.visualStyle;

  const prompt = `
    You are adding a single slide to an existing carousel about: "${config.topic || config.profession}".
    
    GOAL: ${slideContext === 'CTA' ? "Create a powerful Call To Action slide." : "Create an intermediate connection slide."}
    USER INSTRUCTION: "${instruction}"
    
    Visual Style: "${config.visualStyle}" (${styleDesc}).
    Brand Color: "${config.brandColor}".
    Language: ${config.language === 'es' ? 'Spanish' : 'English'}.

    Produce a JSON object for this SINGLE slide.
    
    - If CTA: Ensure the headline triggers an action (Save, Follow, Comment).
    - If Intermediate: Ensure it connects ideas smoothly.
    - VISUALS: Consistent with high-end style.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.INTEGER }, // Placeholder
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
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI for single slide");
    
    const plan = JSON.parse(text) as SlidePlan;
    // Ensure ID is unique timestamp
    plan.id = Date.now();
    return plan;
  } catch (error) {
    console.error("Single Slide Generation Error:", error);
    throw error;
  }
};

/**
 * Step 2: Generate a Single Image using the Reference
 */
export const generateSlideImage = async (
  plan: SlidePlan,
  referenceImageBase64: string | null, // Made optional
  config: UserConfig,
  refinementPrompt?: string // NEW: Optional user feedback for regeneration
): Promise<string> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isBaked = config.renderMode === 'ai-baked';

  // Resolve the visual style prompt.
  const presetStyle = VISUAL_STYLES.find(s => s.id === config.visualStyle);
  const styleDescription = presetStyle ? presetStyle.description[config.language] : config.visualStyle;

  let fullPrompt = "";

  if (isBaked) {
    // Pro Mode: Full Integration with NATIVE text
    fullPrompt = `
      GENERATE A MASTERPIECE VISUAL for a high-end social media carousel.
      
      CORE CONCEPT (VALUE ILLUSTRATION): ${plan.visualMetaphor}
      STYLE DEFINITION: ${styleDescription} (Strictly adhere to this aesthetic).
      
      SCENE DESCRIPTION: ${plan.imagePrompt}
      
      *** VISUAL VALUE EXPLANATION (CRITICAL) ***
      The purpose of this image is to EDUCATE.
      The visual elements must explain this concept: "${plan.textOverlay.subheadline}".
      - Do not just make it pretty. Make it descriptive.
      - If explaining a process, show the steps visually (e.g. 1, 2, 3 floating objects).
      - If explaining a mistake, show the error visually (e.g. a red cross, broken object).
      
      *** TEXT INTEGRATION ***
      The Headline text "${plan.textOverlay.headline}" MUST be NATIVELY INTEGRATED into the environment (Diegetic Text).
      
      INTEGRATION METHOD (Choose based on style '${config.visualStyle}'):
      - If 'Minimalist' or 'Educational': Clean text on a surface, book, or simple 3D letters. High legibility.
      - If 'Disruptive' or 'Urban': Graffiti art, torn paper collage, poster on a wall.
      - If 'Cinematic': Cinematic movie title typography floating in depth.
      - If 'Cyberpunk' or 'Tech': Holographic interface.
      - If 'Comic': Speech bubble or hand-drawn caption.
      
      VISUAL COHERENCE:
      - The text must interact with the scene's lighting.
      - Color: Integrate ${config.brandColor} into the text or scene accents naturally.
    `;
    
    // Character Logic for Baked
    if (plan.includeCharacter) {
      if (referenceImageBase64) {
        fullPrompt += `
          - The character (Reference Person) must be present.
          - The character should INTERACT with the text or data (looking at it, pointing, holding it).
        `;
      } else {
        fullPrompt += `
          - A generated character fitting the profession '${config.profession}' must be present.
          - The character should INTERACT with the text or data.
        `;
      }
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
      
      EDUCATIONAL VISUAL REQUIREMENT:
      This image illustrates the concept: "${plan.textOverlay.subheadline}".
      Ensure the objects in the scene (props, background elements, screens) TELL THIS STORY.
      Example: If the text implies 'Writing', show a pen and paper. If 'Analysis', show data.
      
      Style Guidelines: ${styleDescription}.
      Color Palette: Dominant dark/neutral with accents of ${config.brandColor}. (NOTE: If style is 'Educational' or 'Minimalist', use lighter backgrounds as per style description).
      Quality: Hyper-realistic photography, 8k resolution, cinematic lighting (or illustration style if style '${config.visualStyle}' demands it).
      
      CHARACTER INSTRUCTION: 
      ${plan.includeCharacter 
         ? (referenceImageBase64 ? "The person in the image must look exactly like the reference image provided." : `Generate a professional ${config.profession} character fitting the style.`)
         : "NO PERSON in this image. Focus on the object/concept/infographic."}
      
      CRITICAL: DO NOT include any text in the image. Keep the background clean/negative space for overlay text.
    `;
  }

  // --- REFINEMENT LOGIC ---
  if (refinementPrompt) {
    fullPrompt += `
    
    *** IMPORTANT: USER ADJUSTMENT REQUEST ***
    The user did not like the previous result. Please adjust based on this feedback:
    "${refinementPrompt}"
    
    - If they say "it was too short", ensure it is gone.
    - If they say "fix the face", prioritize facial fidelity.
    - If they say "change lighting", change the lighting.
    `;
  }

  const parts: any[] = [
    { text: fullPrompt }
  ];

  // Add Reference Image if provided
  if (referenceImageBase64 && plan.includeCharacter) {
    const cleanBase64 = referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanBase64,
      },
    });
  }

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