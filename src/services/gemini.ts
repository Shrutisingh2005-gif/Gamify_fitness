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

export async function getDailySuggestions(type: string, todayLogs: any[], userGoal: string | undefined) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return [];

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are a personalized health and wellness coach. 
        The user's goal is: "${userGoal || 'General Fitness'}".
        The category is: "${type}".
        Today's activities in this category: ${JSON.stringify(todayLogs)}.
        
        Analyze if their current activity level is good for their goal.
        Provide 3 actionable suggestions. 
        Each suggestion should have:
        - "title": A short, catchy title.
        - "description": Feedback on their current progress and how to continue (max 2 sentences).
        - "value": A recommended amount to add (number).
        - "unit": The unit for the value (e.g., mins, kcal, hrs, ml).
        
        Return as a JSON array.
      `,
      config: { responseMimeType: "application/json" }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}


