// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// 🔹 Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB-Tpk_mLZ4Z7X1F_jRviBKSVH1ISasfjY",
  authDomain: "dtf-submission.firebaseapp.com",
  projectId: "dtf-submission",
  storageBucket: "dtf-submission.firebasestorage.app",
  messagingSenderId: "1084618654185",
  appId: "1:1084618654185:web:a5eea9f15f9fc7aaba4b78",
  measurementId: "G-K5YRVT4GG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

// 🔹 Price Constant
const pricePerSqInch = 0.0278;
let orderItems = [];
let selectedFile = null;

// 🔹 Handle Image Upload & Auto-Measure Dimensions
document.getElementById("imageUpload").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) {
        alert("No file selected.");
        return;
    }
    if (file.type !== "image/png") {
        alert("Only PNG files are allowed.");
        event.target.value = "";
        return;
    }
    selectedFile = file;
    
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = function() {
        document.getElementById("width").value = (this.width / 300).toFixed(2);
        document.getElementById("height").value = (this.height / 300).toFixed(2);
        updatePrice();
    };
    document.getElementById("previewImage").src = img.src;
});

// 🔹 Function to Calculate Price
function updatePrice() {
    const width = parseFloat(document.getElementById("width").value);
    const height = parseFloat(document.getElementById("height").value);
    const quantity = parseInt(document.getElementById("quantity").value) || 1;
    
    if (!isNaN(width) && !isNaN(height) && !isNaN(quantity)) {
        let finalWidth = width + 0.24;
        let finalHeight = height + 0.24;
        if (finalWidth > 22) finalWidth = 24;
        if (finalHeight > 40) finalHeight = 40;
        if (finalHeight > finalWidth && finalWidth <= 22) {
            [finalWidth, finalHeight] = [finalHeight, finalWidth];
        }
        const area = finalWidth * finalHeight;
        let price = area * pricePerSqInch * quantity;
        document.getElementById("totalPrice").textContent = price.toFixed(2);
    } else {
        document.getElementById("totalPrice").textContent = "0.00";
    }
}

// 🔹 Update Price on Input Change
document.getElementById("width").addEventListener("input", updatePrice);
document.getElementById("height").addEventListener("input", updatePrice);
document.getElementById("quantity").addEventListener("input", updatePrice);

// 🔹 Handle "Add to Order"
document.getElementById("addToOrder").addEventListener("click", function() {
    if (!selectedFile) {
        alert("Please upload an image before adding to the order.");
        return;
    }
    const width = parseFloat(document.getElementById("width").value);
    const height = parseFloat(document.getElementById("height").value);
    const quantity = parseInt(document.getElementById("quantity").value) || 1;
    const price = parseFloat(document.getElementById("totalPrice").textContent);

    orderItems.push({
        file: selectedFile,
        fileName: selectedFile.name,
        quantity: quantity,
        price: price
    });

    updateOrderSummary();
    selectedFile = null;
    document.getElementById("imageUpload").value = "";
    document.getElementById("width").value = "";
    document.getElementById("height").value = "";
    document.getElementById("quantity").value = "1";
    document.getElementById("totalPrice").textContent = "0.00";
});

// 🔹 Function to Update Order Summary
function updateOrderSummary() {
    const table = document.getElementById("orderTable");
    table.innerHTML = `
        <tr>
            <th>File Name</th>
            <th>Cost</th>
            <th>Quantity</th>
            <th>Remove</th>
        </tr>
    `;
    let totalPrice = 0;
    orderItems.forEach((item, index) => {
        const row = table.insertRow(-1);
        row.innerHTML = `
            <td>${item.fileName}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td><button class="delete-btn" data-index="${index}">❌</button></td>
        `;
        totalPrice += item.price;
        row.querySelector(".delete-btn").addEventListener("click", function() {
            orderItems.splice(index, 1);
            updateOrderSummary();
        });
    });

    // 🔹 Update Estimated Total Price
    document.getElementById("totalPriceFinal").textContent = `$${totalPrice.toFixed(2)}`;
}

// 🔹 Handle Order Submission & Upload to Firebase
document.getElementById("submitOrder").addEventListener("click", async function() {
    if (orderItems.length === 0) {
        alert("Please add at least one item to the order before submitting.");
        return;
    }

    // 🔹 Show "Submitting Please Wait..." popup
    document.getElementById("submissionPopup").style.display = "block";

    const customerInfo = {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        street: document.getElementById("street").value,
        city: document.getElementById("city").value,
        state: document.getElementById("state").value,
        zip: document.getElementById("zip").value,
        deliveryMethod: document.querySelector('input[name="delivery"]:checked').value
    };

    let uploadedFiles = [];
    for (let item of orderItems) {
        const storageRef = ref(storage, `orders/${item.fileName}`);
        const snapshot = await uploadBytes(storageRef, item.file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        uploadedFiles.push({
            fileName: item.fileName,
            fileURL: downloadURL,
            quantity: item.quantity,
            price: item.price.toFixed(2)
        });
    }

    await addDoc(collection(db, "orders"), {
        customerInfo,
        items: uploadedFiles,
        totalPrice: document.getElementById("totalPriceFinal").textContent,
        timestamp: new Date()
    });

    // 🔹 Hide "Submitting Please Wait..." popup
    document.getElementById("submissionPopup").style.display = "none";

    alert(`✅ Order submitted successfully!`);
    resetOrder();
});

// 🔹 Reset Order After Submission
function resetOrder() {
    document.getElementById("orderTable").innerHTML = `
        <tr>
            <th>File Name</th>
            <th>Cost</th>
            <th>Quantity</th>
            <th>Remove</th>
        </tr>
    `;
    orderItems = [];
    document.getElementById("totalPriceFinal").textContent = "0.00";
}
