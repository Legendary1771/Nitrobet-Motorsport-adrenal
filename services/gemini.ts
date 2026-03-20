
import { GoogleGenAI, Type, Modality } from "@google/genai";

/**
 * Creates a new instance of the AI client.
 * Using a function allows us to always get the freshest API key from the environment.
 */
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generic handler for API calls to manage rate limits (429) gracefully.
 */
async function handleApiCall<T>(call: () => Promise<T>, fallbackValue: T): Promise<T> {
  try {
    return await call();
  } catch (error: any) {
    console.warn("Gemini API Error:", error);
    
    const errorMessage = error?.message || "";
    // If we hit a 429 or similar quota error, we should inform the UI or return fallback
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      // Dispatch a custom event so the UI can prompt for a key upgrade if it wants
      window.dispatchEvent(new CustomEvent('nitrobet:quota_exceeded', { detail: { message: errorMessage } }));
    }
    
    return fallbackValue;
  }
}

/**
 * Enhanced strategy insight using Google Search Grounding
 */
export const getGroundedStrategyInsight = async (raceName: string, drivers: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for real-time news, weather, and track conditions for the ${raceName}. 
      Based on the current form of these drivers: ${drivers}, provide a 3-sentence high-stakes strategy.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: response.text || "Scanning track telemetry...",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Search Result",
        uri: chunk.web?.uri
      })).filter((s: any) => s.uri) || []
    };
  }, { text: "Strategic blackout. System running on cached telemetry.", sources: [] });
};

/**
 * Live Race commentary and channel finder (NitroTV Core)
 */
export const getNitroTVLiveUpdates = async (raceName: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a real-time update for the ${raceName}. 
      1. What is the current lap/status? 
      2. List 3 legal free-to-air TV channels or official free streams (YouTube, regional broadcasters) where fans can watch this race for free right now.
      3. Are there any major incidents in the last 15 minutes?`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      update: response.text || "Waiting for signal...",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Broadcast Source",
        uri: chunk.web?.uri
      })).filter((s: any) => s.uri) || []
    };
  }, { update: "Satellite link lost. Scrambled signal detected.", sources: [] });
};

/**
 * Track location data using Google Maps Grounding
 */
export const getTrackIntel = async (location: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    
    // Default to Suzuka
    let lat = 34.8431, lng = 136.5410;
    
    // Try to get real location for precision
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch (e) {
      console.log("Using default track coordinates");
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `What are the key characteristics of the ${location} racing circuit and its surrounding facilities? Include details about elevation changes and nearest critical medical centers.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      },
    });

    return {
      text: response.text || "Track geography unavailable.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.maps?.title || "Maps Location",
        uri: chunk.maps?.uri
      })).filter((s: any) => s.uri) || []
    };
  }, { text: "GPS signal lost near the chicane. Manual mapping required.", sources: [] });
};

/**
 * Deep Analysis using Gemini 3 Pro
 */
export const askTheSpotter = async (query: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: query,
      config: {
        systemInstruction: "You are 'The Spotter', an elite motorsport analyst and betting expert. You give complex, data-driven advice with a professional but high-adrenaline tone."
      }
    });
    return response.text;
  }, "Spotter is occupied in the pits. Try again next lap.");
};

/**
 * Audio Transcription for Voice Betting
 */
export const transcribeVoiceBet = async (audioBase64: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            mimeType: 'audio/wav',
            data: audioBase64
          }
        },
        { text: "Transcribe this betting command. Extract the driver name, stake amount, and bet type. Respond in JSON format." }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            driver: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            betType: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }, {});
};

/**
 * Fast Lightning Analysis (Flash Lite)
 */
export const getLightningSummary = async (drivers: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest',
      contents: `Summarize the betting landscape for: ${drivers} in 20 words or less. Very fast.`
    });
    return response.text;
  }, "Intel delayed.");
};
