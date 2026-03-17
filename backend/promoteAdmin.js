const { db } = require("./config/firebase");

/**
 * UTILITY: PROMOTE USER TO ADMIN
 * Usage: node promoteAdmin.js <email>
 */

const email = process.argv[2];

if (!email) {
  console.error("Error: Please provide a user email. Usage: node promoteAdmin.js <email>");
  process.exit(1);
}

const promote = async () => {
  try {
    const userSnapshot = await db.collection("users").where("email", "==", email).limit(1).get();

    if (userSnapshot.empty) {
      console.error(`Error: User with email ${email} not found in Firestore.`);
      process.exit(1);
    }

    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;

    await db.collection("users").doc(userId).update({
      role: "admin",
      updatedAt: new Date()
    });

    console.log(`\x1b[32mSUCCESS: User ${email} (ID: ${userId}) has been promoted to ADMIN.\x1b[0m`);
    process.exit(0);
  } catch (error) {
    console.error("Promotion failed:", error);
    process.exit(1);
  }
};

promote();
