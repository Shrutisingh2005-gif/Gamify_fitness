import { GoogleGenAI } from "@google/genai";

export async function getHealthAdvice(stats: any, recentActivities: any[]) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      return "I'm having trouble connecting to my brain right now. Please make sure your API key is set up!";
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are an expert health and wellness coach. 
        Based on the following user data, provide a short, motivating, and actionable advice (max 3 sentences).
        
        Stats: ${JSON.stringify(stats)}
        Recent Activities: ${JSON.stringify(recentActivities)}
        
        Focus on one area that needs improvement (sleep, activity, or nutrition).
      `,
    });
    
    return response.text || "Keep up the great work! Stay consistent for better results.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm currently resting my circuits. Stay active and eat healthy!";
  }
}

export async function estimateCalories(mealDescription: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { calories: 0, breakdown: "API Key missing" };

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Estimate the total calories for this meal: "${mealDescription}". 
      Return the response in JSON format with "calories" (number) and "breakdown" (string, short explanation).`,
      config: { responseMimeType: "application/json" }
    });
    
    return JSON.parse(response.text || '{"calories": 0, "breakdown": "Error"}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return { calories: 0, breakdown: "Could not estimate calories." };
  }
}

export async function getDailySuggestions(type: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return [];

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 3 actionable health suggestions for the category: "${type}". 
      Each suggestion should have a "title", "description", "value" (number), and "unit" (string).
      Return as a JSON array.`,
      config: { responseMimeType: "application/json" }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
}


