const { GoogleGenerativeAI } = require("@google/generative-ai")
require("dotenv").config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const generateListingDescription = async (itemName, features) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    let prompt = "";
    if (!features && itemName.length > 5 && (itemName.includes(" ") || itemName.includes("Lot"))) {
      prompt = `Act as an expert auction curator. Create a complete listing for this item: "${itemName}".
      Respond ONLY in JSON format:
      {
        "title": "Compelling Title",
        "description": "Professional and detailed 1-2 paragraph description.",
        "category": "One of: Art, Watches, Vehicles, Electronics, Collectibles"
      }`
    } else if (features) {
      prompt = `Generate a compelling auction listing description for an item named "${itemName}". 
      Key features to include: ${features}. 
      Make it sound professional, exciting, and highlight the value for potential bidders.
      Respond with the text description only.`
    } else {
      prompt = itemName
    }

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text()
    
    // Clean up markdown markers if present
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return text
  } catch (error) {
    console.error("AI Generation Error (Triggering Premium Fallback):", error.message)
    // Premium Demo Fallback
    return `Experience the pinnacle of exclusivity with this "${itemName}". 

A masterpiece of design and functionality, this ${features} asset represents a rare opportunity for serious collectors. Featuring impeccable craftsmanship and undeniable presence, it's more than just an item—it's a statement. 

Bid with confidence on this verified rare find. Final verification of authenticity is guaranteed by our elite panel of curators.`
  }
}

const generateAuctionSummary = async (auctionsData) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Act as a senior auction house analyst. I will provide you with a list of auction items and their categories. 
    Analyze the inventory and provide a concise, professional summary. 
    Focus on:
    1. Distribution across categories.
    2. Any notable items or trends in the names.
    3. A brief outlook on the current collection.
    
    Data:
    ${JSON.stringify(auctionsData, null, 2)}
    
    Respond in professional markdown with clear headings.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text().trim()
  } catch (error) {
    console.error("AI Summary Error:", error.message)
    return "AI Summary is currently unavailable. Please check your inventory manually."
  }
}

module.exports = { generateListingDescription, generateAuctionSummary }
