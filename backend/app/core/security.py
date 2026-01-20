from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

PWD_CONTEXT_SCHEMES = ["bcrypt"]
DEPRECATED_SCHEMES = ["auto"]
