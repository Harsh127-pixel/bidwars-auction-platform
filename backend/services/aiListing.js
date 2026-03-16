const { GoogleGenerativeAI } = require("@google/generative-ai")
require("dotenv").config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const generateListingDescription = async (itemName, features) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Generate a compelling auction listing description for an item named "${itemName}". 
    Key features to include: ${features}. 
    Make it sound professional, exciting, and highlight the value for potential bidders.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    return text
  } catch (error) {
    console.error("AI Generation Error (Triggering Premium Fallback):", error.message)
    // Premium Demo Fallback
    return `Experience the pinnacle of exclusivity with this "${itemName}". 

A masterpiece of design and functionality, this ${features} asset represents a rare opportunity for serious collectors. Featuring impeccable craftsmanship and undeniable presence, it's more than just an item—it's a statement. 

Bid with confidence on this verified rare find. Final verification of authenticity is guaranteed by our elite panel of curators.`
  }
}

module.exports = { generateListingDescription }
