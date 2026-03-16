const admin = require("firebase-admin");
const db = require("./config/firebase");

/**
 * SEED DATA: CREATE COMPLETED AUCTIONS FOR ANALYTICS DEMO
 */

const seedAnalytics = async () => {
  try {
    console.log("🚀 Seeding completed auctions for analytics...");

    // Get a sample user (admin themselves or first bidder)
    const usersSnapshot = await db.collection("users").limit(1).get();
    if (usersSnapshot.empty) {
      console.error("Error: No users found to assign as winner.");
      process.exit(1);
    }
    const winnerId = usersSnapshot.docs[0].id;
    const winnerName = usersSnapshot.docs[0].data().username;

    const categories = ['Art', 'Watches', 'Vehicles'];
    const titles = [
      "Vintage Patek Philippe",
      "Street Art - Original Canvas",
      "Restored 1967 Mustang",
      "Hasselblad Camera Kit",
      "Rare Bitcoin Physical Coin"
    ];

    // Create 5 auctions over the last 5 days
    for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const bid = 50000 + (Math.random() * 150000);
        
        const auctionData = {
            title: titles[i % titles.length],
            description: "Analytics test seed data.",
            category: categories[i % categories.length],
            minBid: 50000,
            highestBid: Math.floor(bid),
            highestBidder: winnerId,
            status: "closed",
            startTime: new Date(date.getTime() - 86400000),
            endTime: date, // Using native Date for firestore
            createdAt: new Date(date.getTime() - 86400000 * 2),
            bidCount: 5,
            reserveMet: true
        };

        await db.collection("auctions").add(auctionData);
        console.log(`✅ Created ${auctionData.title} (Sold for ₹${auctionData.highestBid.toLocaleString()} on ${date.toDateString()})`);
    }

    console.log(`\n\x1b[32mSUCCESS: Analytics seeded. High-volume data now visible in Insights.\x1b[0m`);
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedAnalytics();
