# 03. Deep Autoencoder Neural Network for Zero-Day Anomaly Detection

## 1. What is an Autoencoder?
An **Autoencoder** is a self-supervised neural network architecture designed to learn a compressed, low-dimensional representation (**latent space representation**) of input data and then reconstruct the original input from that representation.

### Architecture Topology:
The Sentinel Autoencoder consists of a symmetrical 5-layer feed-forward network:
```
Input Vector (9 Features)
         │
         ▼
[Dense Layer 1: 8 Neurons, ReLU]   <── Encoder: Compresses & filters noise
         │
         ▼
[Bottleneck: 4 Neurons, ReLU]      <── Latent Representation (Core manifold)
         │
         ▼
[Dense Layer 2: 8 Neurons, ReLU]   <── Decoder: Reconstructs the original features
         │
         ▼
Output Vector (9 Features)
```

---

## 2. The Core Intuition: How Does It Detect Fraud Without Labels?
This is one of the most critical questions in a viva examination:
> *"How can your Autoencoder identify fraudulent transactions if it has never been trained on fraud labels?"*

### The Scientific Principle:
1. **Trained Exclusively on Legitimate (Normal) Transactions:**
   * During the training phase, all fraudulent and flagged transactions are filtered out.
   * The Autoencoder is trained **ONLY** on millions of verified normal transactions.
   * The network weights ($W, b$) are optimized to minimize the error between the original normal input $X$ and the reconstructed output $\hat{X}$.
   * As a result, the network becomes an expert at compressing and perfectly reconstructing **normal spending patterns** (e.g., normal domestic amounts, typical daytime hours, low velocities, familiar merchant categories).

2. **The Reconstruction Failure on Zero-Day Fraud:**
   * When an adversary launches a novel, unprecedented fraud attack (a zero-day vector), the transaction contains an abnormal combination of features (e.g., \$4,500 at 03:00 AM from a foreign IP with POS mode 01 and 0 velocity).
   * Because the Autoencoder's latent bottleneck was never optimized for this abnormal combination, **the decoder fails to reconstruct the input accurately**.
   * The difference between the original input $X$ and the reconstructed output $\hat{X}$ explodes, producing a high **Reconstruction Error**.

---

## 3. Mathematical Formulation

### Mean Squared Error (MSE) Reconstruction Loss:
For a transaction vector $X = [x_1, x_2, \dots, x_n]$:
$$\text{Reconstruction Error (MSE)} = \frac{1}{n} \sum_{i=1}^n \left( x_i - \hat{x}_i \right)^2$$
Where:
* $x_i$ is the original scaled input feature.
* $\hat{x}_i$ is the reconstructed feature from the decoder output.
* $n = 9$ (number of features).

### Decision Thresholding:
During training, we compute the distribution of reconstruction errors across the validation set of normal transactions. We define the **Reconstruction Threshold ($\tau$)** as the 99th percentile:
$$\tau = \text{Percentile}_{99}(\text{MSE}_{\text{normal}})$$

When a live transaction arrives in production:
$$\text{Autoencoder Risk Score} = \min\left( \frac{\text{MSE}}{\tau}, 1.0 \right)$$
* If $\text{MSE} \ll \tau$: Risk score $\approx 0.0$ (Normal transaction).
* If $\text{MSE} \ge \tau$: Risk score $\approx 1.0$ (High anomaly / potential zero-day fraud).

---

## 4. Why Autoencoder Over Isolation Forest or One-Class SVM?
* **Non-Linear Manifold Learning:** Isolation Forest uses axis-aligned orthogonal cuts; Autoencoders utilize non-linear activation functions (ReLU) capable of learning complex, non-linear manifolds in higher dimensions.
* **Feature Reconstruction Explainability:** We can inspect which individual feature had the highest squared error $(x_i - \hat{x}_i)^2$ to understand which specific dimension deviated from normality.
* **Deterministic Inference:** Unlike tree partition algorithms that exhibit variance, the forward pass of an autoencoder is purely deterministic matrix multiplication.

---

## 5. The Pure-NumPy Production Optimization (`autoencoder_numpy.py`)
In standard deep learning pipelines, loading TensorFlow / Keras in a cloud container introduces major challenges:
* 500MB+ container bloat.
* High startup latency (TensorFlow GPU/CPU graph compilation takes 3–5 seconds).
* Memory contention under high-concurrency workloads.

### Our Solution:
We implemented a dedicated **Pure-NumPy Forward-Pass Engine**:
1. After training in Keras, we export the weight matrices ($W$) and bias vectors ($b$) to `autoencoder_weights.pkl`.
2. In production (`autoencoder_numpy.py`), inference is performed via pure NumPy vectorized operations:
   $$\text{Layer Output} = \max(0, X \cdot W + b)$$
3. **Outcome:** Zero TensorFlow dependency, sub-1 millisecond execution, and 100% cloud portability!
