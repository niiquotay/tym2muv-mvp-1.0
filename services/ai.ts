import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateAdDescription = async (details: any): Promise<string> => {
  try {
    const prompt = `Write a compelling, professional, and detailed real estate listing description based on the following details:
    - Property Type: ${details.propertyType}
    - Listing Type: ${details.type}
    - Bedrooms: ${details.bedrooms}
    - Bathrooms: ${details.bathrooms}
    - Square Footage: ${details.sqft}
    - Year Built: ${details.yearBuilt}
    - Location: ${details.location}
    - Furnished: ${details.furnished ? 'Yes' : 'No'}
    - Parking: ${details.parking ? 'Yes' : 'No'}
    - Pets Allowed: ${details.petsAllowed ? 'Yes' : 'No'}
    
    The description should be engaging, highlight the key features, and appeal to potential ${details.type === 'Rent' ? 'tenants' : 'buyers'}. Keep it under 150 words.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || '';
  } catch (error) {
    console.error("Error generating description:", error);
    return '';
  }
};

export const suggestPriceRange = async (details: any): Promise<{ min: number; max: number } | null> => {
  try {
    const prompt = `Based on the following real estate property details, suggest a realistic price range in ${details.currency}.
    - Property Type: ${details.propertyType}
    - Listing Type: ${details.type}
    - Bedrooms: ${details.bedrooms}
    - Bathrooms: ${details.bathrooms}
    - Square Footage: ${details.sqft}
    - Location: ${details.location}
    
    Return ONLY a JSON object with 'min' and 'max' numeric properties representing the suggested price range.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            min: { type: Type.NUMBER },
            max: { type: Type.NUMBER }
          },
          required: ["min", "max"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Error suggesting price:", error);
    return null;
  }
};

export const enhanceImage = async (base64Image: string, mimeType: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1], // Remove data URL prefix
              mimeType: mimeType,
            },
          },
          {
            text: 'Enhance this real estate photo. Make it look professional, well-lit, and attractive, as if taken by a professional real estate photographer. Improve lighting, contrast, and color balance.',
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/jpeg;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    console.error("Error enhancing image:", error);
    if (error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('cors') || error.message?.toLowerCase().includes('origin')) {
      alert("Image enhancement failed due to a CORS or Origin error. This usually means your Gemini API Key has 'HTTP referrers' restrictions enabled in Google Cloud Console. Please set the restriction to 'None' or add this app's URL to the allowed list.");
    } else {
      alert("Failed to enhance image. Please check your API key and try again.");
    }
    return null;
  }
};
