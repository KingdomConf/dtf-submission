// Constants and Global Variables
const pricePerSqInch = 0.0278;  // Price per square inch (DTF rate)
let orderItemsArray = [];       // Array to store order items (files and details)

// Image Upload: Validate and process file on selection
document.getElementById("imageUpload").addEventListener("change", function(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];
    if (!file) return;

    // ✅ Accept only PNG files
    if (file.type !== "image/png") {
        alert("Only PNG files are allowed.");
        fileInput.value = "";  // Reset file input selection
        return;
    }

    // Create an Image object to get dimensions
    const img = new Image();
    img.onload = function() {
        // ✅ Check Image DPI (warn if below 300)
        const dpi = getDPI(img);
        if (dpi < 300) {
            alert("⚠️ Warning: Your image is below 300 DPI. We may require further information.");
        }

        // ✅ Calculate dimensions in inches (assuming 300 DPI) 
        let widthInches = img.width / 300;
        let heightInches = img.height / 300;

        // ✅ Add 0.24 inches margin on each side (total +0.48 to each dimension)
        widthInches += 0.48;
        heightInches += 0.48;

        // ✅ If width reaches 22 inches, charge for 24 inches instead
        if (widthInches >= 22) {
            widthInches = 24;
        }

        // ✅ Auto-rotate if width > 22 and height <= 22 (swap dimensions)
        if (widthInches > 22 && heightInches <= 22) {
            [widthInches, heightInches] = [heightInches, widthInches];
        }

        // ✅ Oversize warning if dimensions exceed 22"x40" even after rotation
        if (widthInches > 22 || heightInches > 40) {
            alert("Your image exceeds our recommended size. We will accept your file but may reach out for a new one if necessary.");
        }

        // Update the dimension fields (two decimal places)
        document.getElementById("width").value = widthInches.toFixed(2);
        document.getElementById("height").value = heightInches.toFixed(2);

        // Calculate and display the price for this item
        updatePrice();
    };
    img.src = URL.createObjectURL(file);

    // Show a preview of the image (for user confirmation)
    document.getElementById("previewImage").src = URL.createObjectURL(file);
});

// ✅ Function to estimate DPI of an image (basic estimation using one inch as reference)
function getDPI(image) {
    return image.width;  // Approximate DPI estimation
}

// ✅ Update price for the current selected image
function updatePrice() {
    const width = parseFloat(document.getElementById("width").value);
    const height = parseFloat(document.getElementById("height").value);
    const quantity = parseInt(document.getElementById("quantity").value) || 1;

    if (!isNaN(width) && !isNaN(height) && !isNaN(quantity)) {
        const area = width * height;
        let price = area * pricePerSqInch * quantity;
        price = Math.ceil(price * 100) / 100;
        document.getElementById("totalPrice").textContent = price.toFixed(2);
    } else {
        document.getElementById("totalPrice").textContent = "0.00";
    }
}

document.getElementById("quantity").addEventListener("input", updatePrice);

// Add to Order
document.getElementById("addToOrder").addEventListener("click", function() {
    const fileInput = document.getElementById("imageUpload");
    const width = parseFloat(document.getElementById("width").value);
    const height = parseFloat(document.getElementById("height").value);
    const quantity = parseInt(document.getElementById("quantity").value) || 1;
    const priceText = document.getElementById("totalPrice").textContent;
    const price = parseFloat(priceText);

    if (!fileInput.files.length) {
        alert("Please upload an image before adding to order.");
        return;
    }
    const file = fileInput.files[0];

    const table = document.querySelector(".order-summary table");
    const row = table.insertRow(-1);
    row.innerHTML = `
        <td>${file.name}</td>
        <td>$${priceText}</td>
        <td>${quantity}</td>
        <td><button class="delete-btn">❌</button></td>
    `;

    orderItemsArray.push({ file, fileName: file.name, quantity, price });

    row.querySelector(".delete-btn").addEventListener("click", function() {
        table.deleteRow(row.rowIndex);
        orderItemsArray.splice(row.rowIndex - 1, 1);
        updateFinalPrice();
    });

    updateFinalPrice();
    fileInput.value = "";
    document.getElementById("previewImage").src = "";
    document.getElementById("width").value = "";
    document.getElementById("height").value = "";
    document.getElementById("quantity").value = 1;
    document.getElementById("totalPrice").textContent = "0.00";
});

// ✅ Update Final Price
function updateFinalPrice() {
    let total = 0;
    document.querySelectorAll(".order-summary table tr").forEach((row, index) => {
        if (index > 0) {
            total += parseFloat(row.cells[1].textContent.replace("$", "")) || 0;
        }
    });
    document.getElementById("totalPriceFinal").textContent = total.toFixed(2);
}

// Convert File to Base64
function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ✅ Validate form fields before submitting
function validateForm() {
    const email = document.getElementById("email").value;
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const phone = document.getElementById("phone").value;

    // Check if required fields are filled
    if (!email || !firstName || !lastName || !phone) {
        alert("Please fill out all required fields.");
        return false;
    }

    // Check if email format is valid
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        return false;
    }

    return true;
}

// Convert File to Base64
function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Submit the order (async)
async function submitOrder() {
  if (!validateForm()) return;  // Stop if the form is invalid

  // Ensure order items exist and are not empty
  if (!orderItemsArray || orderItemsArray.length === 0) {
      alert("Please add items to your order before submitting.");
      return; // Stop if no items in the order
  }

  if (typeof totalPriceFinal === "undefined" || totalPriceFinal === null) {
      alert("Total price is not calculated properly.");
      return; // Stop if price is invalid
  }

  const orderItems = [];

  // Loop through items and process them asynchronously
  for (let item of orderItemsArray) {
    if (!item.file || !item.fileName || !item.quantity || !item.price) {
      alert("One or more order items are missing data.");
      return; // Stop if an item is missing data
    }

    const base64String = await convertToBase64(item.file); // This works because the function is async
    orderItems.push({
      fileName: item.fileName,
      fileData: base64String,
      quantity: item.quantity,
      cost: item.price.toFixed(2)
    });
  }

  // Prepare order data to be sent
  const orderData = {
    firstName,
    lastName,
    email,
    phone,
    street,
    city,
    state,
    zip,
    totalPrice: totalPriceFinal,
    orderItems // Ensure orderItems are properly included here
  };

  // Submit the order
  fetch("https://script.google.com/macros/s/AKfycbzQbvwuy-sSME9B819DtN4V7aJKISNlxl4-KVwSlfhbIpe5LufhCvszClZcn5EHP2ZI/exec", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain"  // Change content type to "text/plain" instead of "application/json"
    },
    body: JSON.stringify(orderData), // Ensure the order data is properly stringified
    mode: "cors"  // Ensure CORS is enabled
  })
  .then(response => response.text()) // Use .text() to handle response as plain text
  .then(text => {
    console.log("Server Response:", text);

    // Check for success
    const response = JSON.parse(text);
    if (response.status === "error") {
      alert("❌ Submission failed: " + response.message);
    } else {
      alert("✅ Order submitted successfully!");
      resetForm();  // Reset the form after successful submission
    }
  })
  .catch(error => {
    console.error("Error:", error);
    alert("❌ Submission failed due to an error.");
  });
}

// Attach the Submit Order function to the button
document.getElementById("submitOrder").addEventListener("click", function() {
    console.log("Submitting the order...");  // Debugging line
    submitOrder();
});

// Reset the form after successful submission
function resetForm() {
    document.getElementById("imageUpload").value = "";  // Clear the image input
    document.getElementById("width").value = "";
    document.getElementById("height").value = "";
    document.getElementById("quantity").value = 1;
    document.getElementById("totalPrice").textContent = "0.00";
    document.getElementById("totalPriceFinal").textContent = "0.00";

    // Clear the order summary table
    const table = document.querySelector(".order-summary table");
    const headerRow = document.createElement("tr");

    const thFileName = document.createElement("th");
    thFileName.textContent = "FILE NAME";
    headerRow.appendChild(thFileName);

    const thCost = document.createElement("th");
    thCost.textContent = "COST";
    headerRow.appendChild(thCost);

    const thQuantity = document.createElement("th");
    thQuantity.textContent = "QUANTITY";
    headerRow.appendChild(thQuantity);

    // Clear the table content
    table.innerHTML = ''; // Clear existing rows
    table.appendChild(headerRow); // Add the headers back
}