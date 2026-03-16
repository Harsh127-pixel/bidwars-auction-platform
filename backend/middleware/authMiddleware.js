const admin = require("firebase-admin");
const db = require("../config/firebase");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized - No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Fetch latest user data from Firestore to get role
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ message: "User not found in system records" });
    }

    // Attach user identity and role to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...userDoc.data()
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ message: "Not authorized - Invalid token" });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied - Admin only" });
  }
};

module.exports = { verifyToken, verifyAdmin };
