import io
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError
import torch
from torchvision.models import EfficientNet_V2_S_Weights
from torchvision.models import efficientnet_v2_s

MODEL_PATH = os.environ.get(
    "DEEPSECURE_MODEL_PATH",
    "/app/artifacts/deepsecure-efficientnet-v2-s.pt",
)

app = FastAPI(
    title="DeepSecure Image Detector",
    version="0.1.0",
)

device = torch.device("cpu")
weights = EfficientNet_V2_S_Weights.DEFAULT
image_transform = weights.transforms()
model = efficientnet_v2_s(weights=None)
input_features = model.classifier[1].in_features
model.classifier[1] = torch.nn.Linear(input_features, 2)
label_names = ["fake", "real"]

if os.path.exists(MODEL_PATH):
    checkpoint = torch.load(MODEL_PATH, map_location=device)
    state_dict = checkpoint.get("model_state_dict")
    if state_dict:
        model.load_state_dict(state_dict)
    checkpoint_label_names = checkpoint.get("label_names")
    if isinstance(checkpoint_label_names, list) and len(checkpoint_label_names) == 2:
        label_names = checkpoint_label_names

model.eval()
model.to(device)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.post("/detect")
async def detect(file: UploadFile = File(...)) -> JSONResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Unsupported file type.")

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    except UnidentifiedImageError as error:
        raise HTTPException(status_code=400, detail="Invalid image file.") from error

    pixel_values = image_transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(pixel_values)
        probabilities = torch.softmax(logits, dim=1).squeeze()

    predicted_class_index = int(torch.argmax(probabilities).item())
    label = label_names[predicted_class_index]
    score = float(probabilities[predicted_class_index].item())
    fake_index = label_names.index("fake") if "fake" in label_names else 0
    real_index = label_names.index("real") if "real" in label_names else 1
    ai_confidence = float(probabilities[fake_index].item())
    authentic_confidence = float(probabilities[real_index].item())

    return JSONResponse(
        {
            "label": label,
            "score": score,
            "confidence": score,
            "ai_confidence": ai_confidence,
            "authentic_confidence": authentic_confidence,
        }
    )
