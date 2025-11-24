from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
import base64
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class EncryptionService:
    def __init__(self):
        # Load public and private keys from environment
        self.public_key = self._load_public_key()
        self.private_key = self._load_private_key()
    
    def _load_public_key(self):
        # Load from .env file
        public_key_pem = os.getenv('public_key')
        
        if not public_key_pem:
            raise ValueError("Public key not found in environment variables")
            
        return serialization.load_pem_public_key(
            public_key_pem.encode('utf-8'),
            backend=default_backend()
        )
    
    def _load_private_key(self):
        # Load from .env file  
        private_key_pem = os.getenv('private_key')
        
        if not private_key_pem:
            raise ValueError("Private key not found in environment variables")
            
        return serialization.load_pem_private_key(
            private_key_pem.encode('utf-8'),
            password=None,
            backend=default_backend()
        )
    
    def encrypt_feedback(self, feedback_data: dict) -> str:
        """Encrypt feedback data using public key"""
        try:
            # Convert feedback to JSON string
            feedback_json = json.dumps(feedback_data)
            feedback_bytes = feedback_json.encode('utf-8')
            
            # Encrypt with public key
            encrypted = self.public_key.encrypt(
                feedback_bytes,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            # Encode to base64 for storage
            return base64.b64encode(encrypted).decode('utf-8')
        except Exception as e:
            print(f"Encryption error: {e}")
            raise
    
    def decrypt_feedback(self, encrypted_data: str) -> dict:
        """Decrypt feedback data using private key"""
        try:
            # Decode from base64
            encrypted_bytes = base64.b64decode(encrypted_data.encode('utf-8'))
            
            # Decrypt with private key
            decrypted = self.private_key.decrypt(
                encrypted_bytes,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            # Convert back to dict
            feedback_json = decrypted.decode('utf-8')
            return json.loads(feedback_json)
        except Exception as e:
            print(f"Decryption error: {e}")
            raise

# Create global instance
encryption_service = EncryptionService()