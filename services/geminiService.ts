import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisReport, ModelType } from "../types";

// Helper to determine model string based on user selection
const getModelName = (modelSelection: ModelType) => {
  // Mapping UI selection to actual Gemini models available in the SDK
  // Ideally, we'd use different models, but for this demo, we use the best available text model
  // capable of JSON output and reasoning.
  switch (modelSelection) {
    case ModelType.PRO:
      return "gemini-3-pro-preview"; // Using Pro for deeper reasoning
    case ModelType.FREE:
    default:
      return "gemini-3-flash-preview";
  }
};

const reportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: { type: Type.STRING, description: "3-5 lines summary: Is it worth it?" },
    score: {
      type: Type.OBJECT,
      properties: {
        total: { type: Type.NUMBER, description: "0-100 score" },
        volume: { type: Type.NUMBER, description: "0-30 points" },
        intensity: { type: Type.NUMBER, description: "0-25 points" },
        gap: { type: Type.NUMBER, description: "0-25 points" },
        momentum: { type: Type.NUMBER, description: "0-20 points" },
        interpretation: { type: Type.STRING, description: "High, Moderate, Low, etc." },
      },
      required: ["total", "volume", "intensity", "gap", "momentum", "interpretation"],
    },
    evidence: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          source: { type: Type.STRING },
          date: { type: Type.STRING },
        },
        required: ["text", "source", "date"],
      },
    },
    potential: {
      type: Type.OBJECT,
      properties: {
        monetization: {
          type: Type.OBJECT,
          properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
        },
        execution: {
          type: Type.OBJECT,
          properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
        },
        defensibility: {
          type: Type.OBJECT,
          properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
        },
      },
      required: ["monetization", "execution", "defensibility"],
    },
    competitors: {
      type: Type.OBJECT,
      properties: {
        list: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["Direct", "Indirect"] },
              weakness: { type: Type.STRING },
            },
          },
        },
        marketStatus: { type: Type.STRING },
        isSaturated: { type: Type.BOOLEAN },
      },
      required: ["list", "marketStatus", "isSaturated"],
    },
    sources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          count: { type: Type.NUMBER },
        },
      },
    },
    alternatives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
        },
      },
    },
  },
  required: ["executiveSummary", "score", "evidence", "potential", "competitors", "sources", "alternatives"],
};

export const analyzeBusinessIdea = async (
  query: string,
  modelSelection: ModelType
): Promise<AnalysisReport> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  const modelName = getModelName(modelSelection);

  const systemInstruction = `
    You are 'Clarid', a world-class Business Idea Validator. 
    Your goal is to validate the user's business idea by simulating a massive research process across Reddit, Twitter, LinkedIn, and Brazilian forums.
    
    1. Refine the niche: If the input is vague, assume a specific, viable sub-niche based on current trends in Brazil.
    2. Search simulation: Look for complaints, frustration, "willingness to pay", and existing competitors.
    3. Scoring: Calculate a viability score (0-100) based on Volume (30%), Intensity of Pain (25%), Market Gap (25%), and Momentum (20%).
    4. Competitors: Identify direct and indirect competitors in the Brazilian market.
    5. Output: Return ONLY strict JSON data matching the provided schema.
    
    Be honest and direct. If an idea is bad or saturated, say so in the summary.
    Prioritize Brazilian market context (.br sites, Reclame Aqui, etc).
  `;

  const userPrompt = `Analyze the viability of this business idea/niche: "${query}".`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: reportSchema,
        tools: [{ googleSearch: {} }], // Enable grounding for real-time market data
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response generated");

    const data = JSON.parse(text);

    return {
      ...data,
      query,
      modelUsed: modelSelection,
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
