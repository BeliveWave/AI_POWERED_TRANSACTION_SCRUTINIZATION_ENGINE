# 07. Top 20 Viva Examination Questions & Model Answers (Cheat Sheet)

This document contains the exact high-frequency questions university professors and industry evaluators ask during project defenses, accompanied by scientifically rigorous, confident answers.

---

### Q1: "Why did you choose XGBoost instead of a Deep Learning model (like LSTM or Transformer) for the primary classifier?"
**Answer:**
> *"Financial transactions are heterogeneous tabular data containing mixed categorical, discrete, and continuous variables. In machine learning literature (such as Grinsztajn et al., NeurIPS 2022), tree-based ensembles like XGBoost consistently outperform deep neural networks on tabular benchmarks. Furthermore, XGBoost executes inference in under 1.5 milliseconds via decision tree pointers, whereas deep models introduce high matrix multiplication latency and require GPU hardware, which is infeasible for sub-10ms payment switches."*

---

### Q2: "How can your Autoencoder identify fraudulent transactions if it has never seen a fraud label during training?"
**Answer:**
> *"The Autoencoder is an unsupervised anomaly detector trained exclusively on normal, legitimate transactions. By passing normal transactions through a low-dimensional bottleneck (4 latent neurons), the network learns to reconstruct normal consumer spend patterns with near-zero Mean Squared Error (MSE). When a novel or zero-day fraud attack occurs, the abnormal feature combinations do not conform to the learned normal manifold. Consequently, the decoder fails to reconstruct the input, resulting in an abnormally high reconstruction error that triggers an anomaly alert."*

---

### Q3: "What is the difference between Precision and Recall in fraud detection? Which one is more important?"
**Answer:**
> *"**Recall** measures the percentage of actual fraud attacks our system caught ($\frac{TP}{TP + FN}$). **Precision** measures the percentage of flagged transactions that were truly fraudulent ($\frac{TP}{TP + FP}$). 
> In banking, there is a fundamental trade-off:
> - Low Recall causes direct financial fraud losses and chargebacks.
> - Low Precision causes 'Customer Insult' by erroneously declining legitimate cardholders.
> We prioritize Recall in our ML layer to catch all threats, but introduce a three-tiered decision policy (Approve, Escalate, Decline) where borderline scores are Escalated for 3DS authentication rather than immediately blocked."*

---

### Q4: "Why is Accuracy a misleading metric in fraud detection?"
**Answer:**
> *"Because of extreme class imbalance. In real-world credit card data, fraud represents only 0.1% of transactions (1 in 1,000). A trivial, completely broken model that outputs 'Approve' for every single transaction will achieve 99.9% accuracy, yet miss 100% of fraud attacks. Therefore, we evaluate using ROC-AUC, Precision-Recall curves (PR-AUC), and F1-score rather than accuracy."*

---

### Q5: "What is class imbalance, and how did you mitigate it during training?"
**Answer:**
> *"Class imbalance occurs when the negative class (legitimate transactions) overwhelmingly outnumbers the positive class (fraudulent transactions). We addressed this using XGBoost's `scale_pos_weight` hyperparameter, which sets the weight of positive samples to the ratio of negative to positive cases ($N_{\text{neg}} / N_{\text{pos}}$). This penalizes false negatives heavily during gradient optimization, shifting the decision boundary to prioritize fraud capture."*

---

### Q6: "How did you achieve a sub-10 millisecond response time end-to-end?"
**Answer:**
> *"Through four architectural optimizations:
> 1. **In-Memory Redis Caching:** Velocity counters and geolocation checks execute in under 1 millisecond without hitting the relational disk.
> 2. **Pure-NumPy Forward Pass:** We extracted Keras weights into pure NumPy arrays (`autoencoder_numpy.py`), eliminating TensorFlow engine overhead.
> 3. **TreeSHAP Polynomial Computation:** Exact Shapley values are calculated in $O(TLD^2)$ time rather than slow sampling.
> 4. **Asynchronous Audit Logging:** Database writes and dashboard notifications run in FastAPI background workers so payment authorization returns immediately."*

---

### Q7: "What is SHAP, and why is it better than standard feature importance?"
**Answer:**
> *"Standard feature importance (like Gini impurity) is a **global** metric that summarizes the entire dataset; it cannot explain why a single individual transaction was blocked. SHAP is grounded in cooperative game theory (Shapley values) and provides **local, additive feature attributions**. It satisfies the Local Accuracy axiom ($\sum \phi_i = f(x) - \mathbb{E}[f(X)]$), providing a legally compliant audit trail proving which specific features drove the score up."*

---

### Q8: "What are the limitations of using foreign dataset benchmarks (like Kaggle European data) in a local context?"
**Answer:**
> *"Public datasets reflect Western consumer profiles (Euro/USD currencies, high online subscription density, contactless tap-to-pay). In local markets like Sri Lanka or South Asia, consumer behavior differs significantly: debit cards dominate, mobile QR payment rails (LankaQR, CEFT) are pervasive, Cash-on-Delivery is common for e-commerce, and Purchasing Power Parity (PPP) scales differently. Our architecture mitigates this by allowing dynamic threshold calibration in `system_config` independent of model weights."*

---

### Q9: "What is Concept Drift, and how does your system adapt?"
**Answer:**
> *"Concept drift occurs when statistical properties of the target variable change over time as fraudsters adapt to detection rules. A model trained in January may become obsolete by July. We address this through our `retrain_models.py` pipeline, which periodically retrains both models using recent transactions and verified analyst audit confirmations."*

---

### Q10: "What happens if the Redis cache server crashes?"
**Answer:**
> *"We implemented graceful degradation in `app/core/cache.py`. If Redis fails to connect, the system logs a non-fatal warning, defaults the velocity counter to zero, and allows the transaction to be evaluated by the deterministic rules and ML models without throwing an unhandled exception or halting the payment gateway."*

---

### Q11: "Why do you have an 'Escalate' status in addition to 'Approve' and 'Decline'?"
**Answer:**
> *"In modern banking, an engine should rarely make binary yes/no decisions on borderline transactions. An 'Escalate' status (score between 0.50 and 0.70) triggers stepped-up authentication (such as sending an OTP to the cardholder's mobile or invoking a 3D-Secure challenge). This protects the bank against fraud while avoiding customer insult on legitimate cardholders."*

---

### Q12: "What is POS Entry Mode, and why is it significant in fraud detection?"
**Answer:**
> *"Point of Sale (POS) entry mode indicates how card data entered the terminal (e.g., `01` for manual key entry, `05` for EMV chip, `07` for contactless NFC). Card-Not-Present manual web entry carries a substantially higher risk profile than an EMV chip contact, which features dynamic cryptographic cryptograms that cannot be cloned."*

---

### Q13: "If a legitimate cardholder travels abroad, will their card be automatically blocked?"
**Answer:**
> *"A foreign transaction will trigger the `is_foreign` indicator, raising the baseline score. However, if the transaction is for a normal amount, at an authorized POS chip terminal with 3DS enabled and zero velocity bursts, the supervised XGBoost model will output a low score. The transaction will either be approved or escalated for an SMS OTP confirmation rather than outright declined."*

---

### Q14: "Why did you build an e-commerce simulation sandbox at `/demo`?"
**Answer:**
> *"To prove the operational viability of the engine in a real-world shopping environment. The `/demo` sandbox simulates an actual merchant checkout, sending live JSON payloads to the engine and displaying instant approval, escalation, or decline feedback alongside real-time audit updates on the analyst console."*

---

### Q15: "If you had 6 more months on this project, what would you add?"
**Answer:**
> *"1. **Graph Neural Networks (GNNs):** Implementing inductive graph learning to detect organized fraud rings sharing device fingerprints, shipping addresses, or phone numbers across multiple cardholder IDs.
> 2. **Behavioral Biometrics:** Incorporating keystroke dynamics and mouse cursor velocity during web checkout.
> 3. **Distributed Streaming:** Transitioning the ingestion layer to Apache Kafka for distributed multi-region horizontal scaling."*
