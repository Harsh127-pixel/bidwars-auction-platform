const { db } = require('./backend/config/firebase');

async function test() {
  try {
    console.log('Querying transactions...');
    const snapshot = await db.collection('transactions').limit(10).get();
    console.log('Total transactions in DB:', snapshot.size);
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}, Fields: ${Object.keys(data).join(', ')}`);
      console.log(`  Values: userId=${data.userId}, type=${data.type}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
}

test();
