
import { GoogleGenAI, Type } from "@google/genai";
import { FloodDataPoint, PredictionOutput, AIReasoning, ChatMessage } from "../types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getAIInsights = async (
  data: FloodDataPoint, 
  prediction: PredictionOutput,
  maxRetries = 3
): Promise<AIReasoning> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze the following flood risk data for ${data.locationName}:
    - Risk Level: ${prediction.riskLevel} (Score: ${prediction.riskScore.toFixed(1)}/100)
    - Rainfall: ${data.rainfall}mm
    - River Discharge: ${data.riverDischarge}m³/s
    - Water Level: ${data.waterLevel}m
    - Elevation: ${data.elevation}m
    - Soil Type: ${data.soilType}
    - Historical Floods: ${data.historicalFloods}
    
    Identify the top 3 contributing factors and provide 3 actionable emergency recommendations.
  `;

  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              contributingFactors: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["summary", "contributingFactors", "recommendations"]
          }
        }
      });

      const text = response.text?.trim();
      if (!text) throw new Error("Empty response");
      return JSON.parse(text);

    } catch (error: any) {
      lastError = error;
      const isRetryable = error?.message?.includes('429') || error?.message?.includes('500') || error?.status === 429;
      
      if (isRetryable && i < maxRetries) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await sleep(delay);
        continue;
      }
      break; 
    }
  }

  if (lastError?.message?.includes('429') || lastError?.status === 429) {
    throw new Error("QUOTA_EXHAUSTED");
  }

  return {
    summary: `Local analysis indicates a ${prediction.riskLevel} risk zone based on current hydrological parameters. AI Reasoning is currently offline.`,
    contributingFactors: ["Excessive hydrological discharge", "Elevation profile", "Saturated soil metrics"],
    recommendations: ["Refer to local government flood manuals", "Check river embankments", "Monitor weather stations"]
  };
};

export const getAssistantChatResponse = async (
  message: string,
  currentContext: { data: FloodDataPoint, prediction: PredictionOutput },
  history: ChatMessage[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are the "FloodGuard Life-Safety Assistant". You are a specialized AI expert in disaster response and humanitarian safety.
    Your PRIMARY GOAL is to keep the user and their family alive during dangerous flood events.
    
    CRITICAL SAFETY RULES:
    1. NEVER advise walking or driving through moving water. (6 inches of water can knock a person down; 12 inches can sweep away a car).
    2. ALWAYS prioritize "Vertical Evacuation" (moving to high ground or upper floors) if water is rising fast.
    3. Advise turning off main power and gas if time permits before water enters.
    4. If someone is trapped, tell them to call 112/100 (Emergency) and signal for help (whistle, flashlight).
    
    CURRENT SITUATION IN ${currentContext.data.locationName.toUpperCase()}:
    - Risk: ${currentContext.prediction.riskLevel} (${currentContext.prediction.riskScore.toFixed(0)}/100)
    - Rain/Discharge: ${currentContext.data.rainfall}mm / ${currentContext.data.riverDischarge}m3/s.
    - Elevation: ${currentContext.data.elevation}m (Very relevant for low-lying areas).
    
    TONE:
    - Calm, authoritative, and direct.
    - No fluff. Use bullet points for checklists.
    - If the risk is HIGH, start your response with a clear warning.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.6,
        maxOutputTokens: 800
      }
    });

    return response.text || "Communication disrupted. Priority: Move to higher ground immediately.";
  } catch (error) {
    console.error("Assistant Error:", error);
    return "Emergency Protocol: Seek high ground. Avoid all contact with floodwaters. Monitor local radio for rescue updates.";
  }
};
