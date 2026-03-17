const { db } = require('./backend/config/firebase');

async function test() {
  try {
    const userId = "rPOSwPvKlHedjLe9CeQYnESqOfz1";
    console.log(`Checking user: ${userId}`);
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
        console.log('User data:', userDoc.data());
    } else {
        console.log('User does not exist!');
    }

    console.log(`Checking transactions for ${userId}...`);
    const snapshot = await db.collection('transactions')
      .where('userId', '==', userId)
      .get();
    
    console.log(`Found ${snapshot.size} transactions.`);
    snapshot.docs.forEach(doc => {
        console.log(doc.id, doc.data().type, doc.data().amount);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
