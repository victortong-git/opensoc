#!/usr/bin/env python3
"""
Python Embedding Service using sentence_transformers
Model: NovaSearch/stella_en_400M_v5 (1024-dimensional embeddings)
CPU-only configuration with memory efficient attention disabled
"""

import json
import sys
import argparse
import logging
from sentence_transformers import SentenceTransformer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PythonEmbeddingService:
    def __init__(self, model_name='NovaSearch/stella_en_400M_v5'):
        self.model_name = model_name
        self.model = None
        self.is_initialized = False
        
    def initialize(self):
        """Initialize the embedding model"""
        if self.is_initialized:
            return
            
        try:
            logger.info(f"Loading embedding model: {self.model_name}")
            
            # Load NovaSearch stella model with CPU configuration
            logger.info(f"🚀 Initializing {self.model_name} for CPU inference (1024D)...")
            self.model = SentenceTransformer(
                self.model_name,
                trust_remote_code=True,
                device="cpu",
                config_kwargs={"use_memory_efficient_attention": False, "unpad_inputs": False},
                cache_folder='/home/nodeapp/.cache/huggingface'
            )
            
            self.is_initialized = True
            logger.info(f"✅ Successfully loaded {self.model_name} model (1024D)")
            
        except Exception as e:
            logger.error(f"❌ Failed to load embedding model: {str(e)}")
            raise e
    
    def generate_embedding(self, text):
        """Generate embedding for a single text"""
        if not self.is_initialized:
            self.initialize()
            
        if not text or not isinstance(text, str):
            raise ValueError("Text input is required and must be a string")
            
        try:
            # Generate embedding using sentence_transformers
            embedding = self.model.encode(
                text.strip(),
                convert_to_numpy=True,
                normalize_embeddings=True
            )
            
            # Convert numpy array to list for JSON serialization
            embedding_list = embedding.tolist()
            
            logger.info(f"🔍 Generated embedding with {len(embedding_list)} dimensions")
            return embedding_list
            
        except Exception as inference_error:
            logger.error(f"❌ Failed to generate embedding: {str(inference_error)}")
            raise inference_error
    
    def generate_batch_embeddings(self, texts):
        """Generate embeddings for multiple texts"""
        if not self.is_initialized:
            self.initialize()
            
        if not isinstance(texts, list):
            raise ValueError("Input must be a list of texts")
            
        valid_texts = [text for text in texts if text and isinstance(text, str)]
        if not valid_texts:
            return []
            
        try:
            # Generate batch embeddings
            embeddings = self.model.encode(
                valid_texts,
                convert_to_numpy=True,
                normalize_embeddings=True,
                batch_size=32
            )
            
            # Convert to list format
            embeddings_list = [emb.tolist() for emb in embeddings]
            
            logger.info(f"🔍 Generated {len(embeddings_list)} batch embeddings")
            return embeddings_list
            
        except Exception as e:
            logger.error(f"❌ Failed to generate batch embeddings: {str(e)}")
            raise e
    
    def get_model_info(self):
        """Get model information"""
        return {
            'name': self.model_name,
            'dimensions': 1024,
            'initialized': self.is_initialized
        }

def main():
    parser = argparse.ArgumentParser(description='Python Embedding Service')
    parser.add_argument('--action', choices=['single', 'batch', 'info'], required=True)
    parser.add_argument('--text', type=str, help='Text for single embedding')
    parser.add_argument('--texts', type=str, help='JSON array of texts for batch embedding')
    parser.add_argument('--model', type=str, default='NovaSearch/stella_en_400M_v5', help='Model name')
    
    args = parser.parse_args()
    
    try:
        service = PythonEmbeddingService(args.model)
        
        if args.action == 'info':
            result = service.get_model_info()
        elif args.action == 'single':
            if not args.text:
                raise ValueError("--text is required for single embedding")
            result = {
                'embedding': service.generate_embedding(args.text),
                'dimensions': 1024
            }
        elif args.action == 'batch':
            if not args.texts:
                raise ValueError("--texts is required for batch embedding")
            texts = json.loads(args.texts)
            result = {
                'embeddings': service.generate_batch_embeddings(texts),
                'count': len(texts),
                'dimensions': 1024
            }
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'success': False
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == '__main__':
    main()