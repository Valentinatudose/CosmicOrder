// This service now communicates directly with the Google GenAI API from the client.
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { VisionBuilderInputs, Path, Archetype, DailyPractice, VisionData } from "../types";

// Initialize the Google GenAI client.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  generateVision: async (inputs: VisionBuilderInputs, path: Path): Promise<VisionData> => {
    const { values, lifestyle, work, community, fun } = inputs;

    const pillarNames = path === Path.Relationship 
      ? { values: "Shared Values", lifestyle: "Lifestyle", work: "Work", community: "Family", fun: "Fun" }
      : { values: "Core Values", lifestyle: "Environment & Lifestyle", work: "Daily Work", community: "Impact & Community", fun: "Joy & Fulfillment" };

    const prompt = `
      You are an expert in manifestation and personal transformation.
      A user is creating a vision for their ${path}.
      Their inputs are:
      - ${pillarNames.values}: "${values}"
      - ${pillarNames.lifestyle}: "${lifestyle}"
      - ${pillarNames.work}: "${work}"
      - ${pillarNames.community}: "${community}"
      - ${pillarNames.fun}: "${fun}"

      Follow these instructions precisely:
      1. Weave the 5 inputs into an inspiring vision statement. It must be in the first person, present tense, emotionally resonant, and a maximum of 3 paragraphs. DO NOT include any introductory text like "Here is your vision...".
      2. Based on the statement you just created, write a short, powerful "I am..." headline (3-7 words) that captures its essence.
      3. Return ONLY a JSON object with two keys: "statement" containing the full vision statement, and "headline" containing the "I am..." headline.
      IMPORTANT: Your entire response must be only the raw JSON object.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              statement: { type: Type.STRING, description: "The full vision statement, max 3 paragraphs, without any introductory text." },
              headline: { type: Type.STRING, description: "The 'I am...' headline, 3-7 words." },
            },
            required: ["statement", "headline"],
          },
        },
      });

      const jsonText = response.text.trim();
      const parsed = JSON.parse(jsonText);
      
      parsed.headline = parsed.headline.replace(/"/g, "");

      return parsed;

    } catch (error) {
      console.error("Error generating vision:", error);
      throw new Error("Failed to generate vision.");
    }
  },

  generateVisionIdeas: async (path: Path, questionTitle: string, questionSubtitle: string): Promise<string[]> => {
    const prompt = `
      You are a creative assistant helping a user build a personal vision for their life.
      The user is working on their vision for their "${path}".
      They are currently on the step:
      - Title: "${questionTitle}"
      - Prompt: "${questionSubtitle}"

      Generate 3 distinct, inspiring, and concrete example sentences that a user could write in response to this prompt.
      Each example should be a single sentence.
      The tone should be positive and empowering.
      Return ONLY a JSON object with a single key "ideas" which is an array of strings.
      IMPORTANT: Your entire response must be only the raw JSON object. Do not include any introductory text, markdown formatting, or any explanation.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        ideas: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "An array of 3 example sentences."
                        },
                    },
                    required: ["ideas"],
                },
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return parsed.ideas;

    } catch (error) {
        console.error("Error generating vision ideas:", error);
        return [
            "My partner and I build each other up every single day.",
            "I work in a sunlit studio, feeling creative and free.",
            "We enjoy spontaneous weekend trips to the mountains to recharge."
        ]; // Return fallback ideas
    }
  },

  generateDailyInsight: async (archetype: Archetype, visionHeadline: string): Promise<string> => {
    const archetypeInstructions: Record<Archetype, string> = {
      [Archetype.HopefulDreamer]: "Your insight should gently guide them toward a small, grounded action. They are on a journey and need practical encouragement.",
      [Archetype.HesitantProtector]: "Your insight should reassure them and remind them of their safety and worthiness. They are progressing and need to feel secure.",
      [Archetype.LogicalRealist]: "Your insight should encourage them to connect with the feeling behind their goals, bridging logic and emotion.",
    };
    const instruction = archetypeInstructions[archetype];
    const prompt = `
      Act as a wise and supportive manifestation coach guiding a user on a multi-day journey.
      A user's archetype is "${archetype}".
      Their personal vision headline is: "${visionHeadline}".

      Based on this information, provide a short, potent, and inspiring insight for their day (1-2 sentences). They are making progress, so the insight should feel like it's building on previous work.
      ${instruction}

      The tone must be encouraging and empowering. Start the insight directly, without any preamble.
    `;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      return response.text.trim();
    } catch (error) {
      console.error("Error generating daily insight:", error);
      return "Remember that every small step you take today is a powerful conversation with the universe.";
    }
  },

  generateDailyTask: async (archetype: Archetype, visionHeadline: string, practice: DailyPractice): Promise<string> => {
    const archetypeInstructions: Record<Archetype, string> = {
      [Archetype.HopefulDreamer]: "Gently guide them toward a small, grounded action.",
      [Archetype.HesitantProtector]: "Reassure them and remind them of their safety and worthiness.",
      [Archetype.LogicalRealist]: "Encourage them to connect with the feeling behind their goals.",
    };
    const instruction = archetypeInstructions[archetype];
    const prompt = `
      You are an expert manifestation coach. A user needs a personalized daily task.

      Their details:
      - Archetype: "${archetype}" (${instruction})
      - Vision Headline: "${visionHeadline}"

      Today's practice theme:
      - Title: "${practice.title}"
      - Description: "${practice.description}"
      - Example tasks:
        ${practice.tasks.map(t => `- ${t}`).join('\n')}

      Based on all this information, generate a single, new, and personalized actionable task for the user to complete today.
      The task should be very specific, small, and achievable in under 15 minutes.
      It must align with their archetype's needs and their specific vision.
      Do not repeat the example tasks.
      Output ONLY the task text, with no preamble or quotation marks.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      return response.text.trim().replace(/^"|"$/g, '');
    } catch (error) {
      console.error("Error generating daily task:", error);
      return practice.tasks[Math.floor(Math.random() * practice.tasks.length)];
    }
  },

  generateMeditationAudio: async (script: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: script }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Zephyr' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating meditation audio:", error);
        throw error;
    }
  },
};