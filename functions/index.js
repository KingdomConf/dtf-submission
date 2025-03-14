// Import Firebase Functions & Admin SDK
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Firestore ✅
const db = admin.firestore();

// Load email credentials safely
let gmailUser = "dtfsubmission@gmail.com"; // Default email
let gmailPass = "dyti hcjj ybzw yafh"; // Default password

// Check if Firebase environment variables exist
try {
    const config = functions.config();
    if (config && config.email) {
        gmailUser = config.email.user || gmailUser;
        gmailPass = config.email.pass || gmailPass;
    }
} catch (error) {
    console.warn("⚠️ Warning: Firebase functions.config() is undefined. Using fallback credentials.");
}

// Configure Nodemailer Transport
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: gmailUser,
        pass: gmailPass
    }
});

// Firestore Trigger for New Order Submission ✅
exports.sendOrderEmail = functions.region("us-central1").firestore
    .document("orders/{orderId}")  // ✅ Correct Firestore trigger path
    .onCreate(async (snapshot, context) => {
        const orderData = snapshot.data();
        const orderId = context.params.orderId; // ✅ Get the document ID

        if (!orderData) {
            console.error("❌ Error: No order data found.");
            return null;
        }

        console.log(`📦 New Order Received: ${orderId}`, orderData);

        // Email Configuration
        const mailOptions = {
            from: gmailUser,
            to: gmailUser, // ✅ Send email to yourself or other recipients
            subject: `🛒 New Order Submitted: ${orderId}`,
            text: `New order received:\n\n${JSON.stringify(orderData, null, 2)}`
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log("📩 Email sent successfully!");
        } catch (error) {
            console.error("❌ Email error:", error);
        }

        return null;
    });