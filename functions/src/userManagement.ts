import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";

// Initialize the app only if it's not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const corsHandler = cors({ origin: true });

export const createUser = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    if (request.method !== 'POST') {
        response.status(405).send('Method Not Allowed');
        return;
    }

    const idToken = request.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      response.status(401).send({ error: { message: "Unauthorized" } });
      return;
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const callerUid = decodedToken.uid;
      const userDoc = await admin.firestore().collection("users").doc(callerUid).get();

      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        response.status(403).send({ error: { message: "Permission Denied. Only admins can create users." } });
        return;
      }

      const { email, name, location, municipal, role } = request.body;

      if (!email || !name || !role) {
        response.status(400).send({ error: { message: "Missing required fields." } });
        return;
      }

      const generatedTempPassword = Math.random().toString(36).slice(-8);
      const userRecord = await admin.auth().createUser({
        email: email,
        password: generatedTempPassword,
        displayName: name,
      });

      const uid = userRecord.uid;

      await admin.firestore().collection("users").doc(uid).set({
        uid,
        name,
        email,
        location: role === "admin" ? "" : location,
        municipal: role === "admin" ? "" : municipal,
        role,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        requiresPasswordSetup: true,
      });
      
      response.status(200).send({
        data: {
          message: `Successfully created user ${email}`,
          tempPassword: generatedTempPassword,
        }
      });

    } catch (error: any) {
        console.error("Error creating user:", error);
        response.status(500).send({ error: { message: error.message || "An internal error occurred." } });
    }
  });
}); 