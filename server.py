from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import base64
import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from io import BytesIO

# Set Google Application Credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "service_account.json"

# Initialize Flask App
app = Flask(__name__, static_folder=".")
CORS(app, resources={r"/*": {"origins": "*"}})  # ✅ Properly configured CORS

# Serve Static Files (Frontend)
@app.route("/")
def serve_index():
    return send_from_directory(".", "index.html")

@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(".", filename)

# Google Drive Folder ID (Change this to your Google Drive folder ID)
DRIVE_FOLDER_ID = "12mWs5pPxBdOxrDrlF4pN4EIbrW94aIYu"

# Authenticate Google API
creds, _ = google.auth.default()
drive_service = build("drive", "v3", credentials=creds)

def upload_to_drive(file_data, filename):
    """Uploads an image to Google Drive."""
    file_stream = BytesIO(base64.b64decode(file_data))
    media = MediaIoBaseUpload(file_stream, mimetype="image/png", resumable=True)

    file_metadata = {
        "name": filename,
        "parents": [DRIVE_FOLDER_ID]
    }

    uploaded_file = drive_service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id, webViewLink"
    ).execute()

    return uploaded_file.get("webViewLink")

@app.route("/upload", methods=["POST"])
def upload_file():
    """Handles file upload and pricing calculation."""
    try:
        data = request.json
        file_data = data.get("fileData")
        file_name = data.get("fileName")
        width = float(data.get("width"))
        height = float(data.get("height"))
        quantity = int(data.get("quantity"))
        
        # ✅ Ensure PNG file only
        if not file_name.lower().endswith(".png"):
            return jsonify({"status": "error", "message": "Only PNG files are allowed!"})

        # ✅ Pricing Calculation
        price_per_sq_inch = 0.0278
        width += 0.24  # Add margins
        height += 0.24
        if width >= 22:
            width = 24  # Adjust for price increase
        total_price = round(width * height * price_per_sq_inch * quantity, 2)

        # ✅ Upload file to Google Drive
        drive_link = upload_to_drive(file_data, file_name)

        return jsonify({
            "status": "success",
            "message": "File uploaded successfully!",
            "price": total_price,
            "drive_link": drive_link
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == "__main__":
    app.run(debug=True, port=5000)