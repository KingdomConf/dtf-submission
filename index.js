// Import Firebase Functions & Admin SDK
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin SDK
admin.initializeApp(); 

// Initialize Firestore ✅
const db = admin.firestore(); 

// Load email credentials from Firebase environment variables
const gmailUser = functions.config().email.user || "dtfsubmission@gmail.com";
const gmailPass = functions.config().email.pass || "dyti hcjj ybzw yafh";

// Configure Nodemailer Transport
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: gmailUser,
        pass: gmailPass
    }
});

// Firestore Trigger for New Order Submission ✅
exports.sendOrderEmail = functions.firestore
    .document("orders/{orderId}") // ✅ Correct Firestore trigger path
    .onCreate(async (snapshot, context) => {
        const orderData = snapshot.data();
        const orderId = context.params.orderId; // ✅ Get the document ID

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
    });
