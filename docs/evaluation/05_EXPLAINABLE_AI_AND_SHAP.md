# 05. Explainable AI (XAI) and SHAP (Shapley Additive exPlanations)

## 1. Why is Explainability Mandatory in Banking?
In typical consumer tech (e.g., Netflix movie recommendations or facial recognition in photos), an AI error is benign. In financial banking, **black-box AI is legally prohibited**.

### Regulatory Mandates:
1. **GDPR Article 22 (European Union):** Grants individuals the "Right to an Explanation" whenever an automated algorithm makes a legal or significant decision affecting them (such as declining a payment or freezing a bank account).
2. **Fair Credit Reporting Act (FCRA) & ECOA (Adverse Action Notice):** If a financial institution rejects an applicant or freezes a transaction, it must provide specific, actionable reason codes (e.g., "High velocity in 1 hour" or "Unrecognized international terminal").
3. **Internal Audit & Bias Mitigation:** Fraud analysts must verify that an AI model is not discriminating against particular demographics, zip codes, or card issuing banks.

---

## 2. What is SHAP?
**SHAP (SHapley Additive exPlanations)** is a game-theoretic approach to explain the output of any machine learning model. It connects optimal credit allocation with local explanations using classic **Shapley values** from cooperative game theory (originally developed by Nobel laureate Lloyd Shapley in 1953).

### The Intuitive Analogy:
* Imagine 9 players on a football team collaborate to win a match.
* How much credit does each individual player deserve for the final score?
* In our scrutinization engine:
  * The **players** are the 9 transaction features (`amount`, `velocity_1h`, `is_foreign`, etc.).
  * The **match score** is the model's predicted fraud risk score ($0.0 \to 1.0$).
  * The **Shapley value ($\phi_i$)** is the exact marginal contribution of feature $i$ towards driving the risk score up or down.

### Mathematical Formulation:
$$\phi_i = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \left[ f(S \cup \{i\}) - f(S) \right]$$
Where:
* $F$ is the complete set of all features.
* $S$ is a subset of features without feature $i$.
* $f(S)$ is the model prediction using only feature subset $S$.
* The formula calculates the average marginal contribution of feature $i$ across all possible feature coalitions.

---

## 3. The Additive Property (Why SHAP Beats Other Methods)
SHAP satisfies the **Local Accuracy (Additivity)** efficiency axiom:
$$f(x) = \phi_0 + \sum_{i=1}^M \phi_i$$
Where:
* $\phi_0 = \mathbb{E}[f(X)]$ is the base value (the average fraud rate across the entire dataset).
* $\sum \phi_i$ is the sum of all individual feature attributions.

If the base fraud rate is 0.05 and the model predicts 0.85 for a transaction:
$$\text{Attribution Sum} = 0.85 - 0.05 = +0.80$$
The Shapley values partition that $+0.80$ exactly among the features (e.g., `amount`: $+0.40$, `velocity_1h`: $+0.25$, `is_foreign`: $+0.15$).

---

## 4. Why TreeSHAP Over LIME or Permutation Importance?

| Method | Consistency | Computation Speed | Local vs Global |
|---|---|---|---|
| **Global Feature Importance (Gini/Split)** | Low (Biased toward continuous features with many splits) | Instant | **Global only.** Cannot explain *why a single specific transaction* was declined. |
| **LIME (Local Interpretable Model-agnostic Explanations)** | Medium (Sampling-based; yields different explanations for the exact same sample!) | Slow (Requires 1,000+ perturbations per transaction) | Local |
| **TreeSHAP (Sentinel Implementation)** | **Mathematically Guaranteed Unique & Consistent** | **Ultra-Fast: Sub-5 ms ($O(TLD^2)$ polynomial time)** | **Both Local (single transaction) & Global** |

---

## 5. Implementation in Sentinel
Inside `backend/app/main.py`:
```python
import shap as _shap

# Initialize TreeExplainer on pre-trained XGBoost model
explainer = _shap.TreeExplainer(ml_model)

# Compute Shapley values for the incoming transaction vector X
shap_vals = explainer.shap_values(X)

# Rank features by positive contribution (factors that increased fraud risk)
contribs = list(zip(DEFAULT_FEATURE_NAMES, shap_vals[0]))
contribs.sort(key=lambda x: x[1], reverse=True)

# Select top 3 primary risk drivers
top3 = {f: round(float(v), 4) for f, v in contribs[:3] if v > 0}
shap_json = json.dumps(top3)
```

### Sample Output in Analyst Dashboard:
```json
{
  "amount": 0.4128,
  "velocity_1h": 0.2450,
  "is_foreign": 0.1873
}
```
**Analyst Insight:** *"This transaction was escalated because the \$1,450 amount contributed +41.3% risk, combined with 4 transactions in the last hour (+24.5% risk) from a foreign IP (+18.7% risk)."*
