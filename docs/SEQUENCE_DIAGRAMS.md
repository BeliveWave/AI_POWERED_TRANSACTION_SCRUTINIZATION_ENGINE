# Sequence Diagrams - AI Transaction Scrutinization Engine

## Overview

This document contains sequence diagrams for key system workflows and user interactions.

---

## 1. User Registration and Login Flow

### 1.1 User Registration

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant AuthRouter
    participant AuthService
    participant PasswordHasher
    participant UserRepository
    participant Database
    participant EmailService

    User->>Frontend: Fills registration form
    User->>Frontend: Submits (email, username, password)
    Frontend->>Frontend: Validate input
    Frontend->>AuthRouter: POST /auth/register
    
    AuthRouter->>AuthService: register_user(data)
    AuthService->>PasswordHasher: hash_password(password)
    PasswordHasher-->>AuthService: hashed_password
    
    AuthService->>UserRepository: check_email_exists(email)
    UserRepository->>Database: SELECT * FROM users WHERE email=?
    Database-->>UserRepository: Result
    UserRepository-->>AuthService: email_exists: false
    
    AuthService->>UserRepository: create_user(user_data)
    UserRepository->>Database: INSERT INTO users
    Database-->>UserRepository: User created
    UserRepository-->>AuthService: User object
    
    AuthService->>EmailService: send_welcome_email(user.email)
    EmailService-->>AuthService: Email sent
    
    AuthService-->>AuthRouter: Success response
    AuthRouter-->>Frontend: 201 Created
    Frontend-->>User: "Registration successful! Please login"
```

### 1.2 User Login (with 2FA)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant AuthRouter
    participant AuthService
    participant PasswordHasher
    participant TwoFactorAuth
    participant TokenManager
    participant UserRepository
    participant Database

    User->>Frontend: Enters username & password
    Frontend->>AuthRouter: POST /auth/login
    
    AuthRouter->>AuthService: authenticate(credentials)
    AuthService->>UserRepository: get_by_username(username)
    UserRepository->>Database: SELECT * FROM users WHERE username=?
    Database-->>UserRepository: User data
    UserRepository-->>AuthService: User object
    
    AuthService->>PasswordHasher: verify_password(password, user.password_hash)
    PasswordHasher-->>AuthService: is_valid: true
    
    alt 2FA Enabled
        AuthService-->>AuthRouter: 403 "2FA Required"
        AuthRouter-->>Frontend: 403 Response
        Frontend-->>User: Show OTP input
        User->>Frontend: Enters 6-digit OTP
        Frontend->>AuthRouter: POST /auth/login (with OTP)
        AuthRouter->>AuthService: authenticate(credentials, otp)
        AuthService->>TwoFactorAuth: verify_code(user.otp_secret, otp)
        TwoFactorAuth-->>AuthService: is_valid: true
    end
    
    AuthService->>TokenManager: create_access_token(user.id)
    TokenManager-->>AuthService: JWT token
    
    AuthService->>UserRepository: update_last_login(user.id)
    UserRepository->>Database: UPDATE users SET last_login=NOW()
    Database-->>UserRepository: Updated
    
    AuthService-->>AuthRouter: {access_token, user}
    AuthRouter-->>Frontend: 200 OK with token
    Frontend->>Frontend: Store token & session data
    Frontend-->>User: Redirect to Dashboard
```

---

## 2. Transaction Processing and Fraud Detection

```mermaid
sequenceDiagram
    actor PaymentGateway as Payment Gateway
    participant API as Transaction API
    participant TransactionService
    participant FraudDetectionService
    participant AIModel as AI Fraud Model
    participant TransactionRepo
    participant AlertService
    participant NotificationService
    participant Database
    participant Analyst

    PaymentGateway->>API: POST /transactions/analyze
    Note over PaymentGateway,API: Transaction data: amount, merchant,<br/>customer_id, location, device_id
    
    API->>TransactionService: process_transaction(data)
    TransactionService->>TransactionRepo: create_transaction(data)
    TransactionRepo->>Database: INSERT INTO transactions
    Database-->>TransactionRepo: Transaction ID
    TransactionRepo-->>TransactionService: Transaction object
    
    TransactionService->>FraudDetectionService: analyze(transaction)
    
    Note over FraudDetectionService: Extract features
    FraudDetectionService->>FraudDetectionService: extract_features(transaction)
    FraudDetectionService->>FraudDetectionService: get_customer_profile(customer_id)
    FraudDetectionService->>FraudDetectionService: calculate_velocity_metrics()
    FraudDetectionService->>FraudDetectionService: check_geolocation_anomaly()
    
    FraudDetectionService->>AIModel: predict(features)
    AIModel-->>FraudDetectionService: fraud_score: 0.85
    
    FraudDetectionService->>TransactionRepo: update_fraud_score(transaction_id, 0.85)
    TransactionRepo->>Database: UPDATE transactions SET fraud_score=0.85
    Database-->>TransactionRepo: Updated
    
    alt High Risk (fraud_score > 0.7)
        FraudDetectionService->>TransactionRepo: update_status("Escalate")
        TransactionRepo->>Database: UPDATE transactions SET status='Escalate'
        
        FraudDetectionService->>AlertService: create_alert(transaction)
        AlertService->>Database: INSERT INTO alerts
        Database-->>AlertService: Alert created
        
        AlertService->>NotificationService: notify_analysts(alert)
        NotificationService-->>Analyst: Email/SMS notification
        
        FraudDetectionService-->>TransactionService: {status: "Escalate", fraud_score: 0.85}
    else Medium Risk (0.4-0.7)
        FraudDetectionService->>TransactionRepo: update_status("Pending")
        FraudDetectionService-->>TransactionService: {status: "Pending", fraud_score: 0.5}
    else Low Risk (< 0.4)
        FraudDetectionService->>TransactionRepo: update_status("Approve")
        FraudDetectionService-->>TransactionService: {status: "Approve", fraud_score: 0.2}
    end
    
    TransactionService-->>API: Analysis result
    API-->>PaymentGateway: 200 OK with fraud_score & status
```

---

## 3. Fraud Analyst Reviews Transaction

```mermaid
sequenceDiagram
    actor Analyst as Fraud Analyst
    participant Frontend
    participant API
    participant TransactionService
    participant CustomerService
    participant Database
    participant AuditLog
    participant NotificationService
    participant Customer

    Analyst->>Frontend: Navigates to Transactions page
    Frontend->>API: GET /transactions?status=Escalate
    API->>TransactionService: get_flagged_transactions()
    TransactionService->>Database: SELECT * FROM transactions WHERE status='Escalate'
    Database-->>TransactionService: Transaction list
    TransactionService-->>API: Transactions
    API-->>Frontend: 200 OK with data
    Frontend-->>Analyst: Display flagged transactions
    
    Analyst->>Frontend: Clicks transaction to review
    Frontend->>API: GET /transactions/{id}
    API->>TransactionService: get_transaction_details(id)
    TransactionService->>Database: SELECT transaction + customer data
    Database-->>TransactionService: Full transaction details
    TransactionService-->>API: Transaction details
    API-->>Frontend: 200 OK
    Frontend-->>Analyst: Show transaction details:<br/>- Amount, merchant, location<br/>- Fraud score & reasons<br/>- Customer history<br/>- Device info
    
    Analyst->>Analyst: Reviews information
    
    alt Approve Transaction
        Analyst->>Frontend: Clicks "Approve" button
        Frontend->>API: PUT /transactions/{id}/status
        Note over Frontend,API: {status: "Approve", notes: "Verified legitimate"}
        
        API->>TransactionService: update_status(id, "Approve", notes)
        TransactionService->>Database: UPDATE transactions SET status='Approve'
        Database-->>TransactionService: Updated
        
        TransactionService->>CustomerService: decrease_risk_score(customer_id)
        CustomerService->>Database: UPDATE customers SET risk_score=...
        
        TransactionService->>AuditLog: log_action(analyst, "APPROVE_TRANSACTION", id)
        AuditLog->>Database: INSERT INTO audit_logs
        
        TransactionService->>NotificationService: notify_customer(approved)
        NotificationService-->>Customer: Email: Transaction approved
        
        TransactionService-->>API: Success
        API-->>Frontend: 200 OK
        Frontend-->>Analyst: "Transaction approved successfully"
        
    else Reject Transaction
        Analyst->>Frontend: Clicks "Reject" button
        Frontend->>API: PUT /transactions/{id}/status
        Note over Frontend,API: {status: "Decline", notes: "Confirmed fraud"}
        
        API->>TransactionService: update_status(id, "Decline", notes)
        TransactionService->>Database: UPDATE transactions SET status='Decline'
        
        TransactionService->>CustomerService: increase_risk_score(customer_id)
        CustomerService->>Database: UPDATE customers SET risk_score=...
        
        alt Risk Score > 0.8
            CustomerService->>Database: UPDATE customers SET is_frozen=TRUE
            CustomerService->>NotificationService: notify_customer(account_frozen)
            NotificationService-->>Customer: Email: Account frozen
        end
        
        TransactionService->>AuditLog: log_action(analyst, "REJECT_TRANSACTION", id)
        TransactionService->>NotificationService: notify_customer(declined)
        NotificationService-->>Customer: Email: Transaction declined
        
        TransactionService-->>API: Success
        API-->>Frontend: 200 OK
        Frontend-->>Analyst: "Transaction rejected successfully"
    end
```

---

## 4. Enable Two-Factor Authentication (2FA)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant API
    participant AuthService
    participant TwoFactorAuth
    participant UserRepository
    participant Database

    User->>Frontend: Navigates to Profile Settings
    User->>Frontend: Clicks "Enable 2FA"
    
    Frontend->>API: POST /auth/enable-2fa
    API->>AuthService: enable_2fa(user_id)
    
    AuthService->>TwoFactorAuth: generate_secret()
    TwoFactorAuth-->>AuthService: secret_key
    
    AuthService->>TwoFactorAuth: generate_qr_code(secret_key, user.email)
    TwoFactorAuth-->>AuthService: qr_code_image
    
    AuthService-->>API: {secret, qr_code}
    API-->>Frontend: 200 OK with QR code
    
    Frontend-->>User: Display QR code
    Note over User,Frontend: User scans QR code with<br/>Google Authenticator app
    
    User->>Frontend: Enters verification code from app
    Frontend->>API: POST /auth/verify-2fa
    Note over Frontend,API: {code: "123456"}
    
    API->>AuthService: verify_and_enable_2fa(user_id, code)
    AuthService->>TwoFactorAuth: verify_code(secret, code)
    TwoFactorAuth-->>AuthService: is_valid: true
    
    AuthService->>UserRepository: update_user(id, {otp_secret: secret, is_2fa_enabled: true})
    UserRepository->>Database: UPDATE users SET is_2fa_enabled=TRUE, otp_secret=?
    Database-->>UserRepository: Updated
    
    AuthService-->>API: Success
    API-->>Frontend: 200 OK
    Frontend-->>User: "2FA enabled successfully"
```

---

## 5. Session Timeout and Auto-Logout

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant SessionManager
    participant Browser
    participant API
    participant AuthService

    User->>Frontend: Logs in successfully
    Frontend->>SessionManager: initialize_session()
    SessionManager->>Browser: Set lastActivity timestamp
    SessionManager->>Browser: Set sessionExpiry timestamp
    SessionManager->>SessionManager: Start activity listeners
    
    Note over User,SessionManager: User is active<br/>(mouse, keyboard, clicks)
    
    loop Every user activity
        User->>Frontend: Interacts with page
        Frontend->>SessionManager: Activity detected
        SessionManager->>Browser: Update lastActivity
        SessionManager->>Browser: Extend sessionExpiry
    end
    
    Note over User,SessionManager: User stops interacting<br/>for 13+ minutes
    
    SessionManager->>SessionManager: Check timeout (every 60s)
    SessionManager->>Browser: Get lastActivity
    Browser-->>SessionManager: timestamp
    SessionManager->>SessionManager: Calculate time since activity
    
    alt Time since activity > 13 minutes
        SessionManager->>Frontend: Show warning modal
        Frontend-->>User: "Session expiring in 2:00"
        
        loop Every second
            SessionManager->>Frontend: Update countdown
            Frontend-->>User: "Session expiring in 1:59... 1:58..."
        end
        
        alt User clicks "Continue Session"
            User->>Frontend: Clicks "Continue"
            Frontend->>SessionManager: Reset activity
            SessionManager->>Browser: Update lastActivity
            SessionManager->>Browser: Extend sessionExpiry
            SessionManager->>Frontend: Hide warning
        else User clicks "Logout Now"
            User->>Frontend: Clicks "Logout"
            Frontend->>SessionManager: logout()
            SessionManager->>Browser: Clear all session data
            SessionManager->>Frontend: Redirect to login
        else 15 minutes reached (no action)
            SessionManager->>SessionManager: Timeout threshold exceeded
            SessionManager->>Browser: Clear all session data
            SessionManager->>Frontend: Force logout
            Frontend-->>User: Redirect to login
            Frontend-->>User: "Session expired due to inactivity"
        end
    end
```

---

## 6. AI Model Training and Deployment

```mermaid
sequenceDiagram
    actor Admin as System Admin
    participant Frontend
    participant API
    participant ModelService
    participant DataService
    participant MLPipeline
    participant Database
    participant FileSystem

    Admin->>Frontend: Navigates to AI Model Settings
    Admin->>Frontend: Clicks "Train New Model"
    
    Frontend->>API: POST /admin/ai-model/train
    Note over Frontend,API: {start_date, end_date, parameters}
    
    API->>ModelService: initiate_training(config)
    ModelService->>DataService: extract_training_data(date_range)
    
    DataService->>Database: SELECT transactions with labels
    Database-->>DataService: Transaction dataset
    DataService->>DataService: Clean and preprocess data
    DataService-->>ModelService: Training dataset
    
    ModelService->>MLPipeline: train_model(dataset, parameters)
    
    Note over MLPipeline: Training process<br/>- Feature engineering<br/>- Train/test split<br/>- Model training<br/>- Hyperparameter tuning
    
    MLPipeline-->>ModelService: Trained model
    
    ModelService->>MLPipeline: evaluate_model(model, test_data)
    MLPipeline-->>ModelService: {accuracy: 0.96, precision: 0.94, recall: 0.97, f1: 0.95}
    
    alt Performance acceptable (accuracy > 0.90)
        ModelService->>FileSystem: Save model file
        FileSystem-->>ModelService: model_path
        
        ModelService->>Database: INSERT INTO fraud_models
        Note over ModelService,Database: Version, metrics, parameters, path
        Database-->>ModelService: Model record created
        
        ModelService->>Database: UPDATE fraud_models SET is_active=FALSE WHERE id!=new_id
        ModelService->>Database: UPDATE fraud_models SET is_active=TRUE WHERE id=new_id
        
        ModelService-->>API: {success: true, metrics: {...}}
        API-->>Frontend: 200 OK
        Frontend-->>Admin: "Model trained and deployed successfully<br/>Accuracy: 96%"
        
    else Performance not acceptable
        ModelService-->>API: {success: false, metrics: {...}}
        API-->>Frontend: 400 Bad Request
        Frontend-->>Admin: "Model performance below threshold<br/>Accuracy: 85% (required: 90%)"
    end
```

---

## 7. Generate Fraud Report

```mermaid
sequenceDiagram
    actor Officer as Compliance Officer
    participant Frontend
    participant API
    participant ReportService
    participant TransactionService
    participant CustomerService
    participant Database
    participant PDFGenerator
    participant EmailService

    Officer->>Frontend: Navigates to Reports page
    Officer->>Frontend: Selects report type & date range
    Officer->>Frontend: Clicks "Generate Report"
    
    Frontend->>API: POST /reports/fraud-summary
    Note over Frontend,API: {start_date, end_date, filters}
    
    API->>ReportService: generate_fraud_report(params)
    
    ReportService->>TransactionService: get_transaction_stats(date_range)
    TransactionService->>Database: Complex aggregation queries
    Database-->>TransactionService: Statistics
    TransactionService-->>ReportService: {total, flagged, approved, declined, avg_score}
    
    ReportService->>CustomerService: get_high_risk_customers(date_range)
    CustomerService->>Database: SELECT customers WHERE risk_score > 0.7
    Database-->>CustomerService: Customer list
    CustomerService-->>ReportService: High-risk customers
    
    ReportService->>Database: Get fraud trends by day/week
    Database-->>ReportService: Trend data
    
    ReportService->>ReportService: Compile report data
    
    ReportService->>PDFGenerator: create_pdf(report_data)
    PDFGenerator->>PDFGenerator: Generate charts & tables
    PDFGenerator-->>ReportService: PDF file
    
    ReportService->>Database: INSERT INTO audit_logs (REPORT_GENERATED)
    
    alt Email option selected
        ReportService->>EmailService: send_report(officer.email, pdf)
        EmailService-->>Officer: Email with PDF attachment
    end
    
    ReportService-->>API: {report_id, pdf_url}
    API-->>Frontend: 200 OK with download link
    Frontend-->>Officer: Download PDF automatically
```

---

## Key Sequence Flow Patterns

### Authentication Pattern
1. Client sends credentials
2. Server validates
3. Token generated
4. Session initialized
5. Client stores token
6. Subsequent requests include token in Authorization header

### Data Processing Pattern
1. Request received
2. Validation
3. Service layer processing
4. Repository layer database interaction
5. Response formatted
6. Audit logging

### Error Handling Pattern
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Service
    participant Database

    Client->>API: Request
    API->>Service: Process
    Service->>Database: Query
    Database-->>Service: Error (Connection timeout)
    Service-->>API: Throw exception
    API->>API: Catch exception
    API->>API: Log error
    API-->>Client: 500 Internal Server Error
    Note over API,Client: {error: "message", code: "DB_ERROR"}
```

---

## Performance Considerations

1. **Transaction Analysis**: Must complete in < 200ms
2. **Dashboard Loading**: Should load in < 1 second
3. **Report Generation**: Background job for large reports
4. **Session Check**: Runs every 60 seconds (low overhead)
5. **Database Queries**: Indexed for common access patterns
