from flask import Flask, render_template, request, jsonify
from transformers import pipeline

app = Flask(__name__)

# ✅ Load model properly (no warning)
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)

# ✅ Sentiment function
def analyze(text):
    result = sentiment_pipeline(text)[0]

    label = result["label"]
    score = result["score"]

    if label == "POSITIVE":
        pos = int(score * 100)
        neg = int((1 - score) * 100)
    else:
        neg = int(score * 100)
        pos = int((1 - score) * 100)

    neu = max(0, 100 - pos - neg)

    return {
        "label": label.capitalize(),
        "pos": pos,
        "neg": neg,
        "neu": neu,
        "confidence": int(score * 100)
    }

emotion_pipeline = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    return_all_scores=True
)

@app.route("/emotion", methods=["POST"])
def emotion_api():
    data = request.json
    results = emotion_pipeline(data["text"])[0]

    emotions = {r["label"]: int(r["score"] * 100) for r in results}

    return jsonify({
        "emotions": emotions,
        "top_emotion": max(emotions, key=emotions.get)
    })

# ✅ Home route
@app.route("/")
def home():
    return render_template("index.html")

# ✅ ONLY ONE analyze route
@app.route("/analyze", methods=["POST"])
def analyze_api():
    data = request.json
    return jsonify(analyze(data["text"]))

# ✅ Run app
if __name__ == "__main__":
    app.run(debug=True)