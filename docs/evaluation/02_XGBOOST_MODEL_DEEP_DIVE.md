# 02. XGBoost Supervised Scrutinization Classifier (Deep Dive)

## 1. What is XGBoost?
**XGBoost (eXtreme Gradient Boosting)** is an optimized distributed gradient boosting library implementing machine learning algorithms under the Gradient Boosting framework. In tabular data competitions and production fintech, XGBoost remains the gold standard.

### Core Working Principle:
Unlike Random Forest (which builds independent trees in parallel and averages their predictions via Bagging), **Gradient Boosting builds trees sequentially (Boosting)**:
1. The first tree makes baseline predictions.
2. The algorithm calculates the residuals (errors/gradients) between predictions and actual fraud labels.
3. The next tree is trained specifically to predict and correct the residuals of all previous trees.
4. Each subsequent tree minimizes a penalized objective function:
$$\mathcal{L}^{(t)} = \sum_{i=1}^n l(y_i, \hat{y}_i^{(t-1)} + f_t(x_i)) + \Omega(f_t)$$
Where the regularization term $\Omega(f_t) = \gamma T + \frac{1}{2}\lambda \sum_{j=1}^T w_j^2$ penalizes tree complexity ($T = \text{number of leaves}$, $w = \text{leaf weights}$) to prevent overfitting.

---

## 2. Why XGBoost Over Deep Learning for Tabular Data?
A very common question asked by examiners is:
> *"Why did you use XGBoost instead of a Deep Neural Network (DNN, LSTM, or Transformer) for the supervised model?"*

Here are the four engineering and scientific justifications:

1. **Superiority on Heterogeneous Tabular Features:**
   * Financial transactions are **tabular**, containing a mix of continuous numeric values (`amount`, `velocity_1h`), discrete integers (`hour_of_day`), and categorical codes (`merchant_category_code`, `pos_entry_mode`).
   * Decision trees naturally partition feature spaces via orthogonal decision boundaries. Deep neural networks struggle with coordinate-aligned boundaries on unnormalized tabular data without massive hyperparameter tuning.
   * Empirical benchmarks (e.g., Grinsztajn et al., *Why do tree-based models still outperform deep learning on typical tabular data?*, NeurIPS 2022) prove tree-based ensembles consistently beat deep architectures on tabular benchmarks.

2. **Ultra-Low Latency (<2 ms Inference):**
   * XGBoost evaluates transactions via pre-compiled `if-else` pointer traversals across shallow decision trees.
   * A 100-tree ensemble with max depth of 5 executes in **under 1.5 milliseconds** on a single CPU core without requiring GPU acceleration.
   * Deep neural networks require expensive matrix multiplications that introduce memory and execution overhead.

3. **Handling of Feature Scale Invariance:**
   * Decision trees split on ordering, not magnitude. While neural networks require exact feature scaling, XGBoost is invariant to monotonic feature transformations.

4. **Seamless Integration with TreeSHAP:**
   * Tree-based models allow polynomial-time exact computation of Shapley values via the **TreeSHAP algorithm ($O(TLD^2)$)**, whereas neural networks require slow sampling approximations (KernelSHAP).

---

## 3. The 9 Engineered Features
The supervised model accepts a 9-dimensional feature vector engineered from real-time and historical telemetry:

| Feature Name | Type | Range / Values | Domain Rationale in Banking |
|---|---|---|---|
| `amount` | Float | 0.01 – 1,000,000+ | Large deviations from cardholder mean indicate high fraud risk. |
| `hour_of_day` | Integer | 0 – 23 | Fraudulent card attacks spike during late night / early morning (01:00–05:00) when cardholders are asleep. |
| `velocity_1h` | Integer | 0 – 50+ | **Velocity check:** Fraudsters test stolen cards with rapid micro-charges to verify validity before draining credit lines. |
| `is_foreign` | Binary (0/1) | 0 (Domestic), 1 (Foreign) | Cross-border transactions have significantly higher fraud rates and dispute friction. |
| `merchant_category_code` | Categorical | Encoded integer | High-risk MCCs (e.g., 7995: Gambling, 6051: Cryptocurrency, 5944: Jewellery) carry elevated risk. |
| `pos_entry_mode` | Categorical | `01` (Manual), `05` (Chip), `07` (Contactless) | Card-Not-Present manual web entry carries 10x higher fraud risk than physical EMV chip contact. |
| `currency` | Categorical | USD, EUR, LKR, GBP | Currency mismatch relative to issuing bank profile. |
| `moto_eci_indicator` | Categorical | `00`, `01`, `02` (E-Commerce) | Distinguishes mail order, recurring subscription, and secure web checkouts. |
| `three_d_secure` | Categorical | `Y` (3DS Verified), `N` (Unverified) | Liability shift indicator: 3DS authenticated transactions have cryptographic proof of cardholder presence. |

---

## 4. Overcoming Severe Class Imbalance
In production banking:
$$\text{Fraud Rate} \approx 0.05\% \text{ to } 0.15\% \quad (1 \text{ fraud per } 1,000 \text{ transactions})$$

### The Failure of "Accuracy":
If an examiner asks: *"What is your model's accuracy?"*
> **Answer to Examiner:** *"Accuracy is a fundamentally flawed metric in fraud detection. If 99.9% of transactions are legitimate, a useless model that blindly predicts 'Approve' for every single transaction will achieve 99.9% accuracy, while failing to catch 100% of fraud attacks."*

### Techniques Employed:
1. **`scale_pos_weight` Parameter in XGBoost:**
   $$\text{scale\_pos\_weight} = \frac{\text{Total Negative Samples (Legitimate)}}{\text{Total Positive Samples (Fraud)}}$$
   This forces the loss function to heavily penalize false negatives, shifting the decision boundary to prioritize fraud capture.
2. **Evaluation via Precision-Recall AUC (PR-AUC):**
   * We evaluate using **ROC-AUC** ($\ge 0.985$) and **Precision-Recall curves**.
   * High Recall ensures minimal fraud leakage; calibrated Precision ensures legitimate cardholders are not subjected to false declines.
