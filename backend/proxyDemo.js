const admin = require("firebase-admin");
const db = require("./config/firebase");
const { getMinIncrement, calculateRequiredBid } = require('./utils/proxyEngine');

/**
 * PROXY BIDDING DEMO SCENARIO
 * Alice (Top Proxy) vs Bob (Repeated Bidder)
 */

const runDemo = async () => {
    try {
        console.log("🚀 Initializing Proxy Bidding Demo...");

        // 1. Setup Sample Participants
        const usersSnapshot = await db.collection("users").limit(2).get();
        if (usersSnapshot.docs.length < 2) {
            console.error("Error: Need at least 2 users in DB to run demo.");
            process.exit(1);
        }

        const alice = usersSnapshot.docs[0];
        const bob = usersSnapshot.docs[1];
        const aliceId = alice.id;
        const bobId = bob.id;

        console.log(`👤 Participant A (Proxy): ${alice.data().username}`);
        console.log(`👤 Participant B (Manual): ${bob.data().username}`);

        // Ensure they have plenty of credits
        await db.collection("users").doc(aliceId).update({ credits: 500000, isVerified: true });
        await db.collection("users").doc(bobId).update({ credits: 500000, isVerified: true });

        // 2. Create Demo Auction
        const auctionRef = await db.collection("auctions").add({
            title: "💎 Rare Blue Diamond (Demo)",
            description: "A showcase for Proxy Bidding logic.",
            category: "Collectibles",
            minBid: 1000,
            highestBid: 1000,
            highestBidder: null,
            status: "active",
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600000), // 1 hour
            createdAt: new Date(),
            bidCount: 0
        });
        const auctionId = auctionRef.id;
        console.log(`\n📦 Demo Auction Created: ${auctionId}`);

        // HELPER: Mock the Bidding Engine Logic
        const placeDemoBid = async (userId, amount) => {
            console.log(`\n👉 ${userId === aliceId ? 'ALICE' : 'BOB'} is attempting to bid ₹${amount.toLocaleString()}...`);
            
            try {
                await db.runTransaction(async (transaction) => {
                    const aDoc = await transaction.get(auctionRef);
                    const aData = aDoc.data();
                    const currentPrice = aData.highestBid || aData.minBid;
                    
                    const proxyRef = db.collection("proxyBids").doc(auctionId);
                    const currentProxyDoc = await transaction.get(proxyRef);
                    const currentProxyData = currentProxyDoc.exists ? currentProxyDoc.data() : null;

                    let finalPrice = amount;
                    let newWinnerId = userId;

                    if (currentProxyData && currentProxyData.userId !== userId) {
                        const existingMax = currentProxyData.maxAmount;
                        
                        if (amount > existingMax) {
                            // Alice (existing) had 10k, Bob bids 12k. Bob wins at Alice's max + increment.
                            finalPrice = calculateRequiredBid(existingMax);
                            console.log(`🔥 OUTBID SUCCESS: New bidder exceeds existing proxy. Price jumps to ₹${finalPrice.toLocaleString()}`);
                            transaction.set(proxyRef, { userId, maxAmount: amount, updatedAt: new Date() });
                        } else {
                            // Alice had 10k, Bob bids 5k. Alice remains winner at Bob's bid + increment.
                            finalPrice = calculateRequiredBid(amount);
                            newWinnerId = currentProxyData.userId;
                            console.log(`🛡️ PROXY DEFENSE: Auto-bid triggered. ${newWinnerId === aliceId ? 'Alice' : 'Bob'} retains lead at ₹${finalPrice.toLocaleString()}`);
                        }
                    } else {
                        // First proxy or same user updating
                        console.log(`✅ INITIAL BID: Leader set at ₹${finalPrice.toLocaleString()}`);
                        transaction.set(proxyRef, { userId, maxAmount: amount, updatedAt: new Date() });
                    }

                    transaction.update(auctionRef, {
                        highestBid: finalPrice,
                        highestBidder: newWinnerId,
                        bidCount: admin.firestore.FieldValue.increment(1),
                        updatedAt: new Date()
                    });
                });
            } catch (err) {
                console.error("❌ Bid Failed:", err);
            }
        };

        // --- THE SCENARIO ---

        // Step 1: Alice sets a high Proxy of 10,000
        await placeDemoBid(aliceId, 10000);
        
        // Step 2: Bob tries a low bid of 2,000
        await new Promise(r => setTimeout(r, 1000));
        await placeDemoBid(bobId, 2000);

        // Step 3: Bob tries a higher bid of 6,000
        await new Promise(r => setTimeout(r, 1000));
        await placeDemoBid(bobId, 6000);

        // Step 4: Bob goes all in with 15,000 (Breaking Alice's Proxy)
        await new Promise(r => setTimeout(r, 1000));
        await placeDemoBid(bobId, 15000);

        console.log("\n--- SCENARIO COMPLETE ---");
        const finalDoc = await auctionRef.get();
        const finalData = finalDoc.data();
        console.log(`🏆 Final Winner: ${finalData.highestBidder === aliceId ? 'Alice' : 'Bob'}`);
        console.log(`💰 Final Price: ₹${finalData.highestBid.toLocaleString()}`);
        console.log(`📈 Total Bids: ${finalData.bidCount}`);
        
        process.exit(0);

    } catch (error) {
        console.error("Demo failed:", error);
        process.exit(1);
    }
};

runDemo();
