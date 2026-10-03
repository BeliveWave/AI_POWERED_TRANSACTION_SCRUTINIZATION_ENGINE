"""
Pure-NumPy autoencoder inference.
Eliminates the TensorFlow dependency for cloud deployment.
The weights are extracted from the original Keras model and stored in autoencoder_weights.pkl.
"""
import numpy as np
import joblib
import os

class NumpyAutoencoder:
    """Lightweight autoencoder inference using pre-extracted weights."""
    
    def __init__(self, weights_path: str):
        self.layers = joblib.load(weights_path)
        self._loaded = True
    
    @staticmethod
    def _relu(x):
        return np.maximum(0, x)
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Forward pass through encoder-decoder. X shape: (n_samples, n_features)"""
        out = X.copy()
        n_layers = len(self.layers)
        for i, layer in enumerate(self.layers):
            W = np.array(layer['kernel'])
            b = np.array(layer['bias'])
            out = out @ W + b
            # ReLU on all but last layer (last layer is linear)
            if i < n_layers - 1:
                out = self._relu(out)
        return out
    
    def reconstruction_error(self, X: np.ndarray) -> np.ndarray:
        """Returns per-sample MSE reconstruction error."""
        reconstructed = self.predict(X)
        return np.mean(np.power(X - reconstructed, 2), axis=1)


def load_numpy_autoencoder(base_dir: str):
    """Load the numpy autoencoder from the backend directory. Returns (autoencoder, scaler, metadata) or (None, None, None)."""
    def _find(fname):
        for candidate in [
            os.path.join(base_dir, fname),
            os.path.join(os.getcwd(), fname),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), fname),
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), fname),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), fname),
            fname
        ]:
            if os.path.exists(candidate):
                return candidate
        return os.path.join(base_dir, fname)

    weights_path = _find('autoencoder_weights.pkl')
    scaler_path = _find('autoencoder_scaler.pkl')
    meta_path = _find('autoencoder_metadata.pkl')
    
    if not all(os.path.exists(p) for p in [weights_path, scaler_path, meta_path]):
        return None, None, None
    
    try:
        ae = NumpyAutoencoder(weights_path)
        scaler = joblib.load(scaler_path)
        metadata = joblib.load(meta_path)
        return ae, scaler, metadata
    except Exception as e:
        print(f'Warning: Could not load numpy autoencoder: {e}')
        return None, None, None
