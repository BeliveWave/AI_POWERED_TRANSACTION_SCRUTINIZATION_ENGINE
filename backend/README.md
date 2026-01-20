# Secure Backend Authentication Module

This project implements a secure backend authentication module for a banking application using FastAPI, PostgreSQL, and SQLAlchemy.

## Features

*   **User Registration**: Secure registration with strong password enforcement.
*   **User Login**: Authentication with JWT (JSON Web Tokens).
*   **Security**:
    *   Password hashing using Bcrypt.
    *   Banking-grade password complexity requirements.
    *   CORS configuration.
    *   SQL Injection prevention via SQLAlchemy ORM.
*   **Architecture**: Follows Clean Architecture principles.

## Prerequisites

*   Python 3.8+
*   PostgreSQL installed and running.

## Installation

1.  **Navigate to the backend directory**:
    ```bash
    cd backend
    ```

2.  **Create a virtual environment** (recommended):
    ```bash
    python -m venv venv
    .\venv\Scripts\activate  # Windows
    # source venv/bin/activate  # Linux/Mac
    ```

3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Database Setup**:
    Ensure your PostgreSQL database is running and matches the credentials in `.env`.
    
    Default `.env` settings:
    ```
    DATABASE_URL=postgresql://bank_app_user:StrongPassword@123@localhost:5432/AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE
    ```
    *Make sure to create the database `AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE` in Postgres if it doesn't exist.*

## Running the Application

Start the server using Uvicorn:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

## API Documentation

*   **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs) - Interactive API documentation and testing.
*   **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Testing the API

### 1. Register a User
*   **URL**: `POST /auth/register`
*   **Body**:
    ```json
    {
      "email": "user@example.com",
      "username": "user123",
      "full_name": "John Doe",
      "password": "StrongPassword@123"
    }
    ```

### 2. Login
*   **URL**: `POST /auth/login`
*   **Body**:
    ```json
    {
      "username_or_email": "user123",
      "password": "StrongPassword@123"
    }
    ```
*   **Response**:
    ```json
    {
      "access_token": "eyJhbG...",
      "token_type": "bearer"
    }
    ```

### 3. Health Check
*   **URL**: `GET /health`
