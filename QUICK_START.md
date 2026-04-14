# 🚀 Hybrid Fraud Detection - Quick Start Guide

## What Was Just Built

Your fraud detection system now has:
- ✅ **XGBoost** detects known fraud patterns
- ✅ **Autoencoder** detects zero-day anomalies  
- ✅ **Hybrid Scoring** combines both (60% XGB + 40% AE)
- ✅ **Continuous Learning** monthly retraining

---

## 5-Minute Test

### Step 1: Start the Backend

```bash
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

**Expected output:**
```
🚀 FRAUD DETECTION ENGINE STARTUP
[1/3] Connecting to database... ✅
[2/3] Loading XGBoost model... ✅
[3/3] Loading Autoencoder model... ✅

🎯 HYBRID FRAUD DETECTION ENABLED
```

### Step 2: Run the Simulator

**In a new terminal:**
```bash
cd backend
.\.venv\Scripts\Activate.ps1
python simulator.py
```

You'll see transactions being processed with hybrid scores.

### Step 3: Check the Database

Each transaction now has:
- `fraud_score` - Hybrid score (0-1)
- `xgboost_score` - Known fraud probability
- `autoencoder_score` - Anomaly detection score
- `reconstruction_error` - Raw reconstruction error

---

## Understanding the Scores

### Example Transaction

```json
{
  "fraud_score": 0.62,
  "xgboost_score": 0.45,
  "autoencoder_score": 0.82,
  "reconstruction_error": 0.0456,
  "status": "Escalate",
  "decision_reason": "⚠️ Medium Risk | XGB:0.45|AE:0.82"
}
```

**What this means:**
- XGBoost: 45% chance of known fraud pattern
- Autoencoder: 82% anomaly (unusual behavior detected)
- System: "This looks unusual. Manual review needed." → Escalate

---

## Monthly Retraining

### Run Manually (for testing):

```bash
python retrain_models.py
```

This will:
1. Retrain XGBoost on confirmed frauds (Decline status)
2. Retrain Autoencoder on normal transactions
3. Generate performance metrics
4. Update model versions

### Schedule Automatically:

**On Linux/Mac (add to crontab):**
```bash
0 0 1 * * cd /path/to/backend && python retrain_models.py
```

**On Windows (Task Scheduler):**
- Create new task
- Schedule: 1st day of month, 12:00 AM
- Action: `python C:\path\to\backend\retrain_models.py`

---

## Common Queries

### See all transactions with hybrid scores:

```sql
SELECT 
    id, 
    customer_id, 
    merchant, 
    amount,
    fraud_score,
    xgboost_score,
    autoencoder_score,
    reconstruction_error,
    status
FROM transactions
ORDER BY timestamp DESC
LIMIT 20;
```

### Find transactions where Autoencoder detected anomalies but XGBoost didn't:

```sql
SELECT 
    id, 
    customer_id,
    merchant,
    xgboost_score,
    autoencoder_score,
    status
FROM transactions
WHERE 
    xgboost_score < 0.5 
    AND autoencoder_score > 0.6
    AND status = 'Escalate'
ORDER BY timestamp DESC;
```

These are **new fraud patterns** that should be confirmed by admin for retraining!

---

## Dashboard Enhancements

To display hybrid scores in your React dashboard:

```javascript
// Show both model scores in transaction details
<div className="score-breakdown">
  <div className="score-item">
    <label>XGBoost (Known Patterns)</label>
    <div className="score-bar" style={{width: `${xgboost_score * 100}%`}}>
      {xgboost_score.toFixed(2)}
    </div>
  </div>
  
  <div className="score-item">
    <label>Autoencoder (Anomalies)</label>
    <div className="score-bar" style={{width: `${autoencoder_score * 100}%`}}>
      {autoencoder_score.toFixed(2)}
    </div>
  </div>
  
  <div className="score-item final">
    <label>Hybrid Score (Final)</label>
    <strong>{fraud_score.toFixed(2)}</strong>
  </div>
</div>
```

---

## Troubleshooting

### Issue: "Models not loaded" on startup

**Check:**
1. Are model files in backend folder?
   ```bash
   ls autoencoder_model.h5
   ls fraud_model.pkl
   ```

2. Is TensorFlow installed?
   ```bash
   pip list | grep tensorflow
   ```

**Fix:**
```bash
pip install tensorflow keras
python train_autoencoder.py
```

### Issue: Slow startup

First startup with models loads TensorFlow (normal). Subsequent runs are fast.

### Issue: Database column errors

Run migration:
```bash
python add_hybrid_model_columns.py
```

---

## What Happens Now

### Normal Flow
```
Customer submits transaction
↓
XGBoost scores it: "I know this pattern" (45% fraud)
Autoencoder scores it: "This is unusual" (82% anomaly)
↓
Hybrid score: 62% → ESCALATE for manual review
↓
Admin reviews → Confirms it's fraud ✓
↓
End of month → Retraining runs
Next time same pattern appears → XGBoost catches it instantly (90%+)
```

### Result
- ✅ First appearance: Caught by Autoencoder
- ✅ Manual review: Confirmed as fraud
- ✅ Next month: XGBoost automatically learns it
- ✅ Future attacks: Auto-declined (no manual review)

---

## System Evolution Timeline

```
Month 1: New fraud type X appears
  → Autoencoder flags it (unknown pattern)
  → Admin confirms fraud
  
Month 1 (End of month):
  → retrain_models.py runs
  → XGBoost learns pattern X
  
Month 2: Fraud type X appears again
  → XGBoost instantly recognizes it (91% fraud confidence)
  → Auto-declined, no manual review needed
  
Result: From "What is this?" → "I know exactly what this is"
```

---

## Key Metrics to Track

Over time, monitor these in your dashboard:

1. **Model Accuracy** - Track from retrain_models.py output
2. **Precision & Recall** - From monthly retraining logs
3. **Escalate→Fraud Ratio** - % of escalated transactions admins confirm as fraud
4. **False Positives** - Transactions flagged but legitimate
5. **Processing Time** - Should stay under 100ms

---

## Files & Locations

```
backend/
├── app/main.py                      ← Hybrid prediction logic
├── app/models/transaction.py        ← Updated schema (3 new columns)
├── train_autoencoder.py             ← Trainer script
├── retrain_models.py                ← Monthly retraining
├── autoencoder_model.h5             ← Neural network
├── autoencoder_scaler.pkl           ← Feature scaler
├── autoencoder_metadata.pkl         ← Thresholds & config
├── fraud_model.pkl                  ← XGBoost model
├── HYBRID_SYSTEM_README.md          ← Full documentation
└── requirements.txt                 ← Updated with tensorflow
```

---

## Next Steps

1. ✅ **Test hybrid system**: Run simulator and verify hybrid scores
2. ✅ **Monitor dashboard**: Watch both XGBoost and Autoencoder scores
3. ✅ **Collect feedback**: Note which escalated transactions admins confirm as fraud
4. ✅ **Schedule retraining**: Set up monthly cron job
5. ✅ **Iterate**: Each month the system gets smarter!

---

## Need Help?

1. Check `backend/HYBRID_SYSTEM_README.md` for detailed docs
2. Check `IMPLEMENTATION_COMPLETE.md` for architecture details
3. Review logs when backend starts - they show model loading status

---

**Your fraud detection system is now genuinely intelligent! 🚀**

It learns, adapts, and catches zero-day attacks. This is enterprise-grade AI.
