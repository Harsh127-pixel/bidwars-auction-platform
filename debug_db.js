const { db } = require('./backend/config/firebase');
console.log('Type of db:', typeof db);
console.log('Is db.collection a function?', typeof db.collection === 'function');
console.log('Keys of db:', Object.keys(db).slice(0, 10));
if (typeof db === 'function') {
    console.log('db is a function, maybe it needs to be called?');
}
process.exit(0);
