from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from cryptography.hazmat.backends import default_backend
import base64
import secrets
from typing import Tuple


class EncryptionService:
    @staticmethod
    def generate_encryption_key() -> str:
        return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8')
    
    @staticmethod
    def derive_key_from_password(password: str, salt: bytes) -> bytes:
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        return base64.urlsafe_b64encode(kdf.derive(password.encode()))
    
    @staticmethod
    def encrypt_file(file_data: bytes, encryption_key: str) -> bytes:
        fernet = Fernet(encryption_key.encode())
        encrypted_data = fernet.encrypt(file_data)
        return encrypted_data
    
    @staticmethod
    def decrypt_file(encrypted_data: bytes, encryption_key: str) -> bytes:
        fernet = Fernet(encryption_key.encode())
        decrypted_data = fernet.decrypt(encrypted_data)
        return decrypted_data
    
    @staticmethod
    def encrypt_text(text: str, encryption_key: str) -> str:
        fernet = Fernet(encryption_key.encode())
        encrypted_text = fernet.encrypt(text.encode())
        return base64.urlsafe_b64encode(encrypted_text).decode('utf-8')
    
    @staticmethod
    def decrypt_text(encrypted_text: str, encryption_key: str) -> str:
        fernet = Fernet(encryption_key.encode())
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_text.encode())
        decrypted_text = fernet.decrypt(encrypted_bytes)
        return decrypted_text.decode('utf-8')


encryption_service = EncryptionService()
