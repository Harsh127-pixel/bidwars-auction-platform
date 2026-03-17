const admin = require("firebase-admin");
const { db } = require("./config/firebase");

/**
 * UTILITY: INJECT WEALTH INTO USER ACCOUNT
 * Usage: node topup.js <email> <amount>
 */

const email = process.argv[2];
const amount = parseFloat(process.argv[3]);

if (!email || isNaN(amount)) {
  console.error("Error: Usage: node topup.js <email> <amount>");
  process.exit(1);
}

const topup = async () => {
  try {
    const userSnapshot = await db.collection("users").where("email", "==", email).limit(1).get();

    if (userSnapshot.empty) {
      console.error(`Error: User with email ${email} not found.`);
      process.exit(1);
    }

    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;

    await db.collection("users").doc(userId).update({
      credits: admin.firestore.FieldValue.increment(amount),
      updatedAt: new Date()
    });

    console.log(`\x1b[32mSUCCESS: Injected ₹${amount.toLocaleString()} into ${email}'s ledger.\x1b[0m`);
    process.exit(0);
  } catch (error) {
    console.error("Transaction failed:", error);
    process.exit(1);
  }
};

topup();
