
import { GoogleGenAI, Type } from "@google/genai";

// Robust API key retrieval
const apiKey = 
  ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || 
  ((import.meta as any).env?.GEMINI_API_KEY as string) ||
  (process.env.VITE_GEMINI_API_KEY as string) || 
  (process.env.GEMINI_API_KEY as string) || 
  (process.env.API_KEY as string) ||
  '';

const ai = new GoogleGenAI({ apiKey });

// Model hierarchy for stabilization
const STABLE_MODELS = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.0-pro"];

export const geminiService = {
  async getChatbotResponse(message: string, history: {role: string, parts: {text: string}[]}[]) {
    try {
      const model = ai.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "You are GlowUp Salon's smart assistant. You can answer questions about hair care, pricing (Fades Rs.3500, Bob Rs.6500, Facial Rs.8000), and available stylists. Be professional and encouraging. Use Rs. (Sri Lankan Rupees) for currency."
      });
      const response = await model.generateContent(history.length > 0 ? [...history, { role: 'user', parts: [{ text: message }] }] : message);
      return response.response.text();
    } catch (err: any) {
      console.error("Chatbot neural path failed:", err);
      return "The AI Oracle is currently in deep meditation to restore its neural energy. I can still assist with our traditional ritual menu: Fades (Rs.3500), Bobs (Rs.6500), and Facials (Rs.8000).";
    }
  },

  async getSmartInsights(bookingData: any) {
    try {
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const response = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `Analyze these sanctuary performance patterns: ${JSON.stringify(bookingData)}. 
            Distinguish between Boutique Product Sales and Service Ritual Bookings. 
            Identify peak times where both streams intersect.
            Suggest 3 strategic promotion slots to maximize total manifestation.`
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              peakHours: { type: Type.STRING },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["peakHours", "suggestions"]
          }
        }
      });
      return JSON.parse(response.response.text()?.trim() || '{}');
    } catch (err: any) {
      console.warn("Generating static manifestation due to neural quota:", err.message);
      // Fallback to high-quality static insights
      return {
        peakHours: "11:00 AM - 2:00 PM (Sanctuary Rush) & 4:00 PM - 7:00 PM (Boutique Peak)",
        suggestions: [
          "Sanctuary Ritual Bundle: Book a Service and receive 15% off any Boutique product.",
          "Golden Hour Glow: Implement a 10% loyalty point bonus for rituals booked between 2-4 PM.",
          "Artisan Spotlight: Feature 'Style Transformations' to drive both service and styling product revenue."
        ]
      };
    }
  },

  async generateHairstyle(base64Image: string, styleDescription: string) {
    // Try multiple models in case of 404/429
    const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash-exp"];
    
    for (const modelName of modelsToTry) {
      try {
        const model = ai.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: `MAKOVER INSTRUCTION: Transform the hair in this portrait into a ${styleDescription}. 
          CRITICAL: Maintain the original facial features, bone structure, and skin tone precisely. 
          Only modify the hairstyle and hair color. 
          High-fidelity, studio-quality manifestation.` }
        ]);

        const candidates = result.response.candidates || [];
        for (const candidate of candidates) {
          const parts = candidate.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        }
      } catch (err: any) {
        console.error(`Model ${modelName} failed:`, err.message);
        if (err.message?.includes('404')) continue; // Try next if not found
        throw err; // Re-throw if 429/other so UI can handle it
      }
    }
    return null;
  }
};
