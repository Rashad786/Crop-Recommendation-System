from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib, numpy as np, os

# Paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
model = joblib.load(os.path.join(MODEL_DIR, "best_model.pkl"))
scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
encoder = joblib.load(os.path.join(MODEL_DIR, "label_encoder.pkl"))

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

# FastAPI app
app = FastAPI(title="Crop Recommendation API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ In production replace "*" with frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input schema
class CropInput(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float
    top_n: int = Field(5, ge=1, le=10)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
def predict(inp: CropInput):
    try:
        # Convert input to array
        x = np.array([[getattr(inp, k) for k in FEATURES]], dtype=float)

        # Scale input
        xs = scaler.transform(x)

        # Predict probabilities
        proba = model.predict_proba(xs)[0]  # shape (n_classes,)
        classes = encoder.classes_

        # Sort classes by probability (descending)
        order = np.argsort(proba)[::-1]

        best_i = order[0]
        topn = [
            {"crop": str(classes[i]), "score": float(proba[i])}
            for i in order[:inp.top_n]
        ]

        return {
            "best_crop": str(classes[best_i]),
            "confidence": float(proba[best_i]),
            "topn": topn,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
