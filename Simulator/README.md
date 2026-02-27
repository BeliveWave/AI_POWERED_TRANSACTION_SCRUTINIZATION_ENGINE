# Transaction Simulator

This simulator generates realistic transaction data for testing the AI-Powered Transaction Scrutinization Engine.

## Description

The transaction simulator creates synthetic transaction data that mimics real-world banking transactions, including both legitimate and fraudulent patterns. This is useful for:
- Testing the fraud detection engine
- Training machine learning models
- Demonstrating the system's capabilities
- Load testing the backend API

## Prerequisites

- Python 3.8+
- Backend server must be running on `http://localhost:8000`

## Installation

1. **Ensure virtual environment is activated** (from project root):
   ```bash
   # Windows PowerShell
   .\.venv\Scripts\Activate.ps1
   
   # Linux/Mac
   source .venv/bin/activate
   ```

2. **Navigate to simulator directory:**
   ```bash
   cd Simulator
   ```

3. **Dependencies are already installed** with the backend requirements.

## Usage

Run the simulator:
```bash
python simlulator.py
```

**Note:** There's a typo in the filename (`simlulator.py` instead of `simulator.py`). Use the command above with the actual filename.

## Configuration

Modify the simulator script to adjust:
- Number of transactions to generate
- Transaction patterns (amounts, frequencies, etc.)
- Fraudulent transaction probability
- Customer profiles

## Output

The simulator will:
- Send transactions to the backend API
- Display transaction status and fraud scores
- Log results to the console

## Troubleshooting

**Error: Connection refused**
- Ensure the backend server is running: `uvicorn app.main:app --reload --port 8000`
- Check backend is accessible at `http://localhost:8000/health`

**Error: File not found**
- Use the correct filename: `python simlulator.py` (note the typo in the filename)
