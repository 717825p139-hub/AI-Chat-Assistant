const PRESETS = [
  "The product exceeded all my expectations! The delivery was super fast, the packaging was perfect, and the quality is outstanding. I've already recommended it to all my friends. Absolutely love it!",
  "Terrible experience. The item arrived damaged, customer support was completely unhelpful, and I waited three weeks for a refund that never came. Worst purchase I've ever made.",
  "The package arrived on Tuesday. It contains 12 units as described. The color matches the product listing. Standard delivery time of 5-7 business days was met.",
  "The interface looks clean and modern, which I appreciate, but the performance issues make it frustrating to use. Some features are brilliant, others feel half-finished."
];

const POSITIVE_WORDS = ["love", "great", "excellent", "outstanding", "perfect", "amazing", "wonderful", "fantastic", "best", "brilliant", "happy", "pleased", "enjoy", "awesome", "superb", "recommend", "fast", "quality", "exceeded", "expectations", "appreciate", "good", "nice"];
const NEGATIVE_WORDS = ["terrible", "worst", "damaged", "unhelpful", "awful", "horrible", "bad", "hate", "disappointed", "frustrated", "poor", "useless", "broken", "failure", "wrong", "slow", "expensive", "waste", "never", "regret", "issues", "frustrating", "half-finished"];
const NEUTRAL_WORDS = ["arrived", "contains", "matches", "standard", "delivery", "met", "units", "described", "color", "package", "item", "product", "contains", "time", "days"];

let history = [];
let analyzing = false;

const loadingMessages = ["Running NLP pipeline...", "Tokenizing input...", "Evaluating sentiment vectors...", "Classifying emotional tone...", "Computing confidence scores..."];

function loadPreset(i) {
  document.getElementById('inputText').value = PRESETS[i];
  updateChar();
}

function updateChar() {
  const txt = document.getElementById('inputText').value;
  const cnt = document.getElementById('charCount');
  const len = txt.length;
  cnt.textContent = `${len} / 500`;
  if (len > 500) {
    document.getElementById('inputText').value = txt.substring(0, 500);
    cnt.textContent = '500 / 500';
  }
}

function analyzeText(text) {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  let posCount = 0, negCount = 0, neuCount = 0;
  let posWords = [], negWords = [], neuWords = [];

  words.forEach(w => {
    if (POSITIVE_WORDS.includes(w)) { posCount++; if (!posWords.includes(w)) posWords.push(w); }
    else if (NEGATIVE_WORDS.includes(w)) { negCount++; if (!negWords.includes(w)) negWords.push(w); }
    else if (NEUTRAL_WORDS.includes(w)) { neuCount++; if (!neuWords.includes(w)) neuWords.push(w); }
  });

  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  const caps = (text.match(/[A-Z]{2,}/g) || []).length;
  posCount += exclamations * 0.5 + caps * 0.3;
  negCount += questions * 0.2;

  const total = Math.max(posCount + negCount + neuCount + 1, 1);
  let posP = Math.round((posCount / total) * 100);
  let negP = Math.round((negCount / total) * 100);
  let neuP = Math.max(0, 100 - posP - negP);

  const wordCount = words.length;
  const subjectivity = Math.min(100, Math.round(((posWords.length + negWords.length) / Math.max(wordCount * 0.3, 1)) * 100));
  const intensity = exclamations > 1 || caps > 0 ? 'High' : posP > 70 || negP > 70 ? 'Medium' : 'Low';

  let label, icon, confidence, bgColor, textColor;
  if (posP > negP && posP > neuP) {
    label = 'Positive'; icon = '😊'; bgColor = '#E1F5EE'; textColor = '#0F6E56'; confidence = Math.min(99, posP + 12);
  } else if (negP > posP && negP > neuP) {
    label = 'Negative'; icon = '😟'; bgColor = '#FAECE7'; textColor = '#993C1D'; confidence = Math.min(99, negP + 12);
  } else {
    label = 'Neutral'; icon = '😐'; bgColor = '#E6F1FB'; textColor = '#185FA5'; confidence = Math.min(99, 65 + Math.random() * 20);
  }

  const sigWords = [...posWords.slice(0, 4).map(w => ({ w, type: 'pos' })), ...negWords.slice(0, 4).map(w => ({ w, type: 'neg' })), ...neuWords.slice(0, 3).map(w => ({ w, type: 'neu' }))];

  return { posP, negP, neuP: Math.min(neuP, 100), label, icon, bgColor, textColor, confidence: Math.round(confidence), subjectivity, intensity, sigWords };
}

function updateHistory(text, result) {
  history.unshift({ text: text.substring(0, 60) + (text.length > 60 ? '…' : ''), label: result.label, conf: result.confidence, color: result.label === 'Positive' ? 'var(--pos)' : result.label === 'Negative' ? 'var(--neg)' : 'var(--neu)' });
  if (history.length > 5) history.pop();
  renderHistory();
}

function renderHistory() {
  const wrap = document.getElementById('historyWrap');
  const list = document.getElementById('historyList');
  wrap.style.display = 'block';
  list.innerHTML = history.map(h => `
    <div class="history-item">
      <div class="hi-dot" style="background:${h.color}"></div>
      <div class="hi-text">${h.text}</div>
      <div class="hi-score" style="color:${h.color}">${h.label} ${h.conf}%</div>
    </div>
  `).join('');
}

async function analyze() {
  const text = document.getElementById('inputText').value.trim();
  if (!text) return;

  const res = await fetch('/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  const result = await res.json();

  // Example output usage
  document.getElementById('heroLabel').textContent = result.label;
  document.getElementById('posScore').textContent = result.pos + "%";
  document.getElementById('negScore').textContent = result.neg + "%";
  document.getElementById('neuScore').textContent = result.neu + "%";
}
function clearAll() {
  document.getElementById('inputText').value = '';
  document.getElementById('charCount').textContent = '0 / 500';
  document.getElementById('results').style.display = 'none';
}