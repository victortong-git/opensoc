import React, { useState } from 'react';
import { Code, Copy, Terminal, FileText, Zap, ExternalLink, ArrowRight, Database, Cpu, Globe } from 'lucide-react';

const CodeExamples: React.FC = () => {
  const [activeExample, setActiveExample] = useState('complete-script');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const examples = {
    'complete-script': {
      title: 'Complete Training Script',
      description: 'Full Python script for fine-tuning GPT-OSS 20B with OpenSOC data',
      whenToUse: 'Use when you want end-to-end training in one script. Best for first-time users and automated training pipelines.',
      includes: 'Everything from data loading to model saving, with OpenSOC data integration',
      code: `#!/usr/bin/env python3
"""
OpenSOC GPT-OSS 20B Fine-Tuning Script
Fine-tune GPT-OSS 20B on OpenSOC security alert data for improved threat analysis.

Requirements:
- 14GB+ VRAM for QLoRA
- OpenSOC exported training data (JSONL format)
- Unsloth, transformers, datasets, trl libraries
"""

import json
import torch
from datasets import Dataset
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments

def load_opensoc_data(file_path):
    """Load OpenSOC JSONL training data"""
    with open(file_path, 'r') as f:
        data = [json.loads(line) for line in f]
    return data

def format_opensoc_prompt(example):
    """Format OpenSOC data for GPT-OSS training"""
    return {
        "text": tokenizer.apply_chat_template([
            {
                "role": "user", 
                "content": f"Analyze this security alert and provide classification, tags, risk assessment, and recommended actions:\\n\\n{example['input']}"
            },
            {
                "role": "assistant", 
                "content": example['output']
            }
        ], tokenize=False, add_generation_prompt=False)
    }

def main():
    # 1. Load GPT-OSS 20B with QLoRA
    print("Loading GPT-OSS 20B model...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name="unsloth/gpt-oss-20b",  # MXFP4 quantized
        max_seq_length=16384,
        dtype=None,
        load_in_4bit=True,
    )
    
    # 2. Configure LoRA
    print("Adding LoRA adapters...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=32,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", 
                       "gate_proj", "up_proj", "down_proj"],
        lora_alpha=16,
        lora_dropout=0.05,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=42,
    )
    
    # 3. Load OpenSOC training data
    print("Loading OpenSOC training data...")
    train_data = load_opensoc_data('opensoc_training.jsonl')
    val_data = load_opensoc_data('opensoc_validation.jsonl')
    
    # 4. Format datasets
    train_dataset = Dataset.from_list(train_data).map(format_opensoc_prompt)
    val_dataset = Dataset.from_list(val_data).map(format_opensoc_prompt)
    
    print(f"Training samples: {len(train_dataset)}")
    print(f"Validation samples: {len(val_dataset)}")
    
    # 5. Configure trainer
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        dataset_text_field="text",
        max_seq_length=16384,
        args=TrainingArguments(
            per_device_train_batch_size=1,
            gradient_accumulation_steps=4,
            warmup_steps=10,
            max_steps=len(train_dataset) // 4,  # ~1 epoch
            learning_rate=2e-4,
            fp16=not torch.cuda.is_bf16_supported(),
            bf16=torch.cuda.is_bf16_supported(),
            logging_steps=1,
            optim="adamw_8bit",
            weight_decay=0.01,
            lr_scheduler_type="linear",
            seed=42,
            output_dir="opensoc_gpt_oss_checkpoints",
            eval_strategy="steps",
            eval_steps=25,
            save_steps=25,
            load_best_model_at_end=True,
            metric_for_best_model="eval_loss",
            greater_is_better=False,
        ),
    )
    
    # 6. Start training
    print("Starting fine-tuning...")
    trainer.train()
    
    # 7. Save models
    print("Saving fine-tuned model...")
    model.save_pretrained("opensoc_gpt_oss_lora")
    tokenizer.save_pretrained("opensoc_gpt_oss_lora")
    
    # Save merged model for easier deployment
    model.save_pretrained_merged("opensoc_gpt_oss_merged", tokenizer)
    
    print("Fine-tuning completed! Models saved to:")
    print("  - opensoc_gpt_oss_lora (LoRA weights)")
    print("  - opensoc_gpt_oss_merged (full model)")

if __name__ == "__main__":
    main()`
    },
    'data-loading': {
      title: 'Data Loading & Preparation',
      description: 'Load and format OpenSOC exported data for training',
      whenToUse: 'Use when you need to debug data issues or customize preprocessing. Best for data quality analysis and troubleshooting.',
      includes: 'ZIP file handling, data validation, format conversion, and quality checks',
      code: `import json
from datasets import Dataset

def load_opensoc_data(file_path):
    """Load OpenSOC JSONL training data"""
    with open(file_path, 'r') as f:
        data = [json.loads(line) for line in f]
    
    print(f"Loaded {len(data)} training examples")
    return data

def validate_opensoc_data(data):
    """Validate OpenSOC data format"""
    required_fields = ['instruction', 'input', 'output', 'metadata']
    
    for i, example in enumerate(data[:5]):  # Check first 5 examples
        missing_fields = [field for field in required_fields if field not in example]
        if missing_fields:
            print(f"Example {i}: Missing fields {missing_fields}")
        else:
            print(f"Example {i}: ✅ Valid format")
            
            # Parse input/output to verify structure
            try:
                input_data = json.loads(example['input'])
                output_data = json.loads(example['output'])
                
                print(f"  Input keys: {list(input_data.keys())}")
                print(f"  Output keys: {list(output_data.keys())}")
                print(f"  Confidence: {example['metadata'].get('confidence_score', 'N/A')}")
                
            except json.JSONError as e:
                print(f"  ❌ JSON parsing error: {e}")

def format_for_gpt_oss(example, tokenizer):
    """Format OpenSOC example for GPT-OSS training"""
    
    # Create security analysis prompt
    security_prompt = f"""Analyze this security alert and provide a detailed assessment:

Alert Details:
{example['input']}

Please provide:
1. Security event type classification
2. Relevant event tags
3. Risk assessment level
4. Recommended remediation actions

Base your analysis on the alert context, severity, and available indicators."""

    # Format as chat conversation
    messages = [
        {"role": "user", "content": security_prompt},
        {"role": "assistant", "content": example['output']}
    ]
    
    # Apply chat template
    formatted_text = tokenizer.apply_chat_template(
        messages, 
        tokenize=False, 
        add_generation_prompt=False
    )
    
    return {"text": formatted_text}

# Example usage
if __name__ == "__main__":
    # Load your exported data
    train_data = load_opensoc_data('opensoc_training.jsonl')
    val_data = load_opensoc_data('opensoc_validation.jsonl')
    
    # Validate format
    print("\\nValidating training data:")
    validate_opensoc_data(train_data)
    
    print("\\nValidating validation data:")
    validate_opensoc_data(val_data)
    
    # Show example formatted output
    if train_data:
        print("\\nExample formatted conversation:")
        print("="*50)
        # Note: This would require tokenizer to be loaded first
        # formatted = format_for_gpt_oss(train_data[0], tokenizer)
        # print(formatted['text'][:500] + "...")
        print("(Load tokenizer first to see formatted output)")`
    },
    'inference': {
      title: 'Model Inference Example', 
      description: 'Use your fine-tuned model for security alert analysis',
      whenToUse: 'Use when testing your fine-tuned model on new alerts. Best for model evaluation and production integration.',
      includes: 'Model loading, real-time inference, response parsing, and error handling',
      code: `import json
import torch
from unsloth import FastLanguageModel

def load_finetuned_model(model_path="opensoc_gpt_oss_merged"):
    """Load your fine-tuned OpenSOC model"""
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=model_path,
        max_seq_length=16384,
        dtype=None,
        load_in_4bit=True,
    )
    
    # Enable fast inference mode
    FastLanguageModel.for_inference(model)
    return model, tokenizer

def analyze_security_alert(model, tokenizer, alert_data):
    """Analyze a security alert using the fine-tuned model"""
    
    # Format the alert for analysis
    security_prompt = f"""Analyze this security alert and provide a detailed assessment:

Alert Details:
{json.dumps(alert_data, indent=2)}

Please provide:
1. Security event type classification
2. Relevant event tags  
3. Risk assessment level
4. Recommended remediation actions

Base your analysis on the alert context, severity, and available indicators."""

    # Create chat messages
    messages = [
        {"role": "user", "content": security_prompt}
    ]
    
    # Apply chat template and tokenize
    inputs = tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt"
    ).to("cuda")
    
    # Generate response
    with torch.no_grad():
        outputs = model.generate(
            input_ids=inputs,
            max_new_tokens=512,
            use_cache=True,
            temperature=0.7,
            do_sample=True,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id
        )
    
    # Decode response
    response = tokenizer.decode(
        outputs[0][inputs.shape[-1]:], 
        skip_special_tokens=True
    )
    
    return response

def main():
    # Load your fine-tuned model
    print("Loading fine-tuned OpenSOC model...")
    model, tokenizer = load_finetuned_model()
    
    # Example security alert
    example_alert = {
        "alert_title": "Suspicious PowerShell Execution",
        "alert_description": "Encoded PowerShell command detected with potential malicious payload",
        "severity": 4,
        "source_system": "EDR",
        "event_timestamp": "2025-01-15T14:30:00Z",
        "raw_log_data": {
            "process": "powershell.exe",
            "command_line": "powershell -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAAgAFMAeQBzAHQAZQBtAC4ATgBlAHQALgBXAGUAYgBDAGwAaQBlAG4AdAA=",
            "parent_process": "cmd.exe",
            "user": "SYSTEM",
            "host": "workstation-01"
        }
    }
    
    # Analyze the alert
    print("\\nAnalyzing security alert...")
    print("="*60)
    
    analysis = analyze_security_alert(model, tokenizer, example_alert)
    print(analysis)
    
    # Parse the JSON response if it's structured
    try:
        if analysis.startswith('{') and analysis.endswith('}'):
            parsed_analysis = json.loads(analysis)
            print("\\nParsed Analysis:")
            print(f"Event Type: {parsed_analysis.get('security_event_type', 'Unknown')}")
            print(f"Risk Level: {parsed_analysis.get('risk_assessment', 'Unknown')}")
            print(f"Tags: {[tag.get('tag') for tag in parsed_analysis.get('event_tags', [])]}")
    except json.JSONDecodeError:
        print("\\nNote: Response is natural language format")

if __name__ == "__main__":
    main()`
    },
    'deployment': {
      title: 'Model Deployment',
      description: 'Deploy your fine-tuned model in production',
      whenToUse: 'Use when integrating fine-tuned model into OpenSOC backend. Best for production deployment and API integration.',
      includes: 'Service classes, async processing, OpenSOC backend integration, and error handling',
      code: `"""
OpenSOC GPT-OSS Model Deployment Guide

This script shows how to integrate your fine-tuned GPT-OSS model
into the OpenSOC backend for real-time alert analysis.
"""

import json
import asyncio
from typing import Dict, Any
from unsloth import FastLanguageModel

class OpenSOCGPTOSSAnalyzer:
    def __init__(self, model_path: str = "opensoc_gpt_oss_merged"):
        """Initialize the fine-tuned GPT-OSS analyzer"""
        self.model = None
        self.tokenizer = None
        self.model_path = model_path
        
    async def initialize(self):
        """Load the fine-tuned model"""
        print(f"Loading fine-tuned model from {self.model_path}...")
        
        self.model, self.tokenizer = FastLanguageModel.from_pretrained(
            model_name=self.model_path,
            max_seq_length=16384,
            dtype=None,
            load_in_4bit=True,
        )
        
        # Enable fast inference
        FastLanguageModel.for_inference(self.model)
        print("✅ Model loaded and ready for inference")
    
    async def analyze_alert(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze a security alert using the fine-tuned model"""
        
        if not self.model or not self.tokenizer:
            raise RuntimeError("Model not initialized. Call initialize() first.")
        
        # Format alert data for analysis
        alert_context = {
            "alert_title": alert_data.get("title", ""),
            "alert_description": alert_data.get("description", ""),
            "severity": alert_data.get("severity", 1),
            "source_system": alert_data.get("source_system", ""),
            "event_timestamp": alert_data.get("event_time", ""),
            "raw_log_data": json.dumps(alert_data.get("raw_data", {}))
        }
        
        # Create analysis prompt
        prompt = f"""Analyze this security alert and provide classification, tags, risk assessment, and recommended actions:

{json.dumps(alert_context, indent=2)}"""

        # Generate analysis
        messages = [{"role": "user", "content": prompt}]
        
        inputs = self.tokenizer.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_tensors="pt"
        ).to("cuda")
        
        with torch.no_grad():
            outputs = self.model.generate(
                input_ids=inputs,
                max_new_tokens=512,
                temperature=0.7,
                do_sample=True,
                top_p=0.9,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        response = self.tokenizer.decode(
            outputs[0][inputs.shape[-1]:], 
            skip_special_tokens=True
        )
        
        # Try to parse as JSON, fallback to text
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"analysis": response, "format": "natural_language"}

# Integration example for OpenSOC backend
class SOCAnalystAgent:
    def __init__(self):
        self.gpt_oss_analyzer = OpenSOCGPTOSSAnalyzer()
        
    async def initialize(self):
        """Initialize the GPT-OSS analyzer"""
        await self.gpt_oss_analyzer.initialize()
    
    async def analyze_alert(self, alert_id: str, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enhanced alert analysis using fine-tuned GPT-OSS"""
        
        try:
            # Run analysis with fine-tuned model
            analysis = await self.gpt_oss_analyzer.analyze_alert(alert_data)
            
            # Structure the response for OpenSOC
            return {
                "alert_id": alert_id,
                "ai_analysis": {
                    "model": "opensoc-gpt-oss-20b",
                    "version": "fine-tuned-v1",
                    "analysis_timestamp": datetime.utcnow().isoformat(),
                    "security_event_type": analysis.get("security_event_type", "unknown"),
                    "event_tags": analysis.get("event_tags", []),
                    "risk_assessment": analysis.get("risk_assessment", "medium"),
                    "recommended_actions": analysis.get("recommended_actions", []),
                    "confidence_score": 0.95,  # High confidence for fine-tuned model
                    "raw_analysis": analysis
                }
            }
            
        except Exception as e:
            print(f"GPT-OSS analysis failed: {e}")
            return {"error": str(e)}

# Example usage in OpenSOC backend service
async def example_integration():
    # Initialize analyzer
    soc_agent = SOCAnalystAgent()
    await soc_agent.initialize()
    
    # Example alert from OpenSOC database
    sample_alert = {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "title": "Suspicious Network Connection",
        "description": "Outbound connection to known malicious IP address",
        "severity": 4,
        "source_system": "Firewall",
        "raw_data": {
            "src_ip": "192.168.1.100",
            "dst_ip": "203.0.113.42",
            "port": 443,
            "bytes_sent": 1024,
            "connection_duration": "30s"
        }
    }
    
    # Analyze with fine-tuned model
    result = await soc_agent.analyze_alert(sample_alert["id"], sample_alert)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(example_integration())`
    },
    'docker-setup': {
      title: 'Docker Training Environment',
      description: 'Containerized setup for GPT-OSS fine-tuning',
      whenToUse: 'Use when you need reproducible training environment. Best for team collaboration, CI/CD, and resource management.',
      includes: 'Containerized setup, GPU configuration, environment isolation, and automated execution',
      code: `# Dockerfile for GPT-OSS Fine-tuning
FROM nvidia/cuda:12.1-devel-ubuntu22.04

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \\
    python3 \\
    python3-pip \\
    git \\
    wget \\
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Install Python packages
RUN pip3 install --upgrade pip
RUN pip3 install --upgrade --force-reinstall --no-cache-dir unsloth unsloth_zoo
RUN pip3 install torch transformers datasets trl peft accelerate

# Copy training scripts
COPY train_opensoc_model.py /workspace/
COPY requirements.txt /workspace/

# Set environment variables
ENV PYTHONPATH=/workspace
ENV HF_HOME=/workspace/.cache/huggingface
ENV TRANSFORMERS_CACHE=/workspace/.cache/huggingface

# Create entrypoint script
RUN echo '#!/bin/bash\\n\\
echo "OpenSOC GPT-OSS Fine-tuning Environment"\\n\\
echo "CUDA Available: $(python3 -c \\"import torch; print(torch.cuda.is_available())\\")"\\n\\
echo "GPU Count: $(python3 -c \\"import torch; print(torch.cuda.device_count())\\")"\\n\\
echo "GPU Memory: $(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -1) MB"\\n\\
echo ""\\n\\
echo "To start training:"\\n\\
echo "  python3 train_opensoc_model.py"\\n\\
echo ""\\n\\
exec "$@"' > /workspace/entrypoint.sh

RUN chmod +x /workspace/entrypoint.sh

ENTRYPOINT ["/workspace/entrypoint.sh"]
CMD ["bash"]

---

# docker-compose.override.yml addition
version: '3.8'

services:
  gpt-oss-trainer:
    build:
      context: .
      dockerfile: Dockerfile.gpt-oss-trainer
    container_name: opensoc-gpt-oss-trainer
    volumes:
      - ./fine-tuning:/workspace/data
      - ./models:/workspace/models
      - ./.hf_cache:/workspace/.cache/huggingface
    environment:
      - CUDA_VISIBLE_DEVICES=0
      - HF_HOME=/workspace/.cache/huggingface
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    working_dir: /workspace
    tty: true
    stdin_open: true

---

# Training script execution
docker-compose up -d gpt-oss-trainer
docker-compose exec gpt-oss-trainer python3 train_opensoc_model.py

# Monitor training progress
docker-compose exec gpt-oss-trainer tail -f opensoc_gpt_oss_checkpoints/trainer_state.json`
    }
  };

  return (
    <div className="space-y-6">
      {/* Reference Source */}
      <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <ExternalLink className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">Reference Source</span>
        </div>
        <p className="text-xs text-blue-200">
          Code examples based on: <a 
            href="https://colab.research.google.com/github/unslothai/notebooks/blob/main/nb/gpt-oss-(20B)-Fine-tuning.ipynb" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-blue-100 font-medium"
          >
            GPT-OSS (20B) Fine-tuning Notebook
          </a> - Complete implementation guide with OpenSOC data integration
        </p>
      </div>

      {/* Training Process Overview */}
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-opensoc-300 mb-4 flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>OpenSOC → GPT-OSS Training Process</span>
        </h3>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Even though OpenSOC exports structured training data, additional data loading and preparation is required 
            to transform the data into GPT-OSS compatible format for fine-tuning.
          </p>
          
          <div className="bg-soc-dark-900 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Complete Workflow</h4>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center space-x-2 bg-opensoc-600/20 px-3 py-1 rounded">
                <Database className="w-3 h-3" />
                <span>OpenSOC Export</span>
              </div>
              <ArrowRight className="w-3 h-3 text-gray-500" />
              <div className="flex items-center space-x-2 bg-blue-600/20 px-3 py-1 rounded">
                <FileText className="w-3 h-3" />
                <span>Load ZIP Files</span>
              </div>
              <ArrowRight className="w-3 h-3 text-gray-500" />
              <div className="flex items-center space-x-2 bg-yellow-600/20 px-3 py-1 rounded">
                <Code className="w-3 h-3" />
                <span>Format Conversion</span>
              </div>
              <ArrowRight className="w-3 h-3 text-gray-500" />
              <div className="flex items-center space-x-2 bg-green-600/20 px-3 py-1 rounded">
                <Cpu className="w-3 h-3" />
                <span>GPT-OSS Training</span>
              </div>
              <ArrowRight className="w-3 h-3 text-gray-500" />
              <div className="flex items-center space-x-2 bg-purple-600/20 px-3 py-1 rounded">
                <Globe className="w-3 h-3" />
                <span>Deploy Model</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <h5 className="font-medium text-gray-300 mb-2">Why Data Preparation is Needed:</h5>
              <div className="space-y-1 text-gray-400">
                <div>• OpenSOC exports structured JSONL format</div>
                <div>• GPT-OSS requires chat template conversation format</div>
                <div>• Tokenization needed for efficient training</div>
                <div>• Hugging Face Dataset objects required by trainer</div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-300 mb-2">Format Transformation:</h5>
              <div className="space-y-1 text-gray-400">
                <div>• OpenSOC: <code>{`{"instruction":"...", "input":"...", "output":"..."}`}</code></div>
                <div>• GPT-OSS: <code>{`{"text": "<|user|>prompt<|assistant|>response"}`}</code></div>
                <div>• Chat template applied via tokenizer</div>
                <div>• Conversation format for instruction tuning</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Examples Navigation */}
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Choose Your Implementation Approach</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {Object.entries(examples).map(([key, example]) => (
            <button
              key={key}
              onClick={() => setActiveExample(key)}
              className={`text-left p-3 rounded-lg border transition-all ${
                activeExample === key
                  ? 'bg-opensoc-600/20 border-opensoc-500 text-white'
                  : 'bg-soc-dark-700 border-soc-dark-600 text-gray-300 hover:bg-soc-dark-600 hover:border-soc-dark-500'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Code className="w-4 h-4" />
                <span className="text-sm font-medium">{example.title}</span>
              </div>
              <div className="text-xs text-gray-400 mb-2">{example.description}</div>
              <div className="text-xs">
                <div className="text-opensoc-400 font-medium mb-1">When to use:</div>
                <div className="text-gray-400">{example.whenToUse}</div>
              </div>
              <div className="text-xs mt-2">
                <div className="text-green-400 font-medium mb-1">Includes:</div>
                <div className="text-gray-400">{example.includes}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Example */}
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-opensoc-300 flex items-center space-x-2">
              <Terminal className="w-5 h-5" />
              <span>{examples[activeExample as keyof typeof examples].title}</span>
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {examples[activeExample as keyof typeof examples].description}
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(examples[activeExample as keyof typeof examples].code)}
            className="flex items-center space-x-2 px-3 py-2 bg-opensoc-600/20 hover:bg-opensoc-600/30 text-opensoc-400 rounded-lg border border-opensoc-500/30 transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Copy All</span>
          </button>
        </div>
        
        <div className="bg-soc-dark-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            {examples[activeExample as keyof typeof examples].code}
          </pre>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-opensoc-300 mb-4 flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>Training Tips for SOC Use Cases</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Data Preparation</h4>
            <div className="text-xs text-gray-400 space-y-1">
              <div>• Export with minimum confidence 8/10 for high quality</div>
              <div>• Include diverse security event types in training set</div>
              <div>• Balance true positives and false positives</div>
              <div>• Use 70/20/10 train/validation/test split</div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Training Optimization</h4>
            <div className="text-xs text-gray-400 space-y-1">
              <div>• Start with learning rate 2e-4, adjust if needed</div>
              <div>• Monitor validation loss to prevent overfitting</div>
              <div>• Use gradient accumulation for larger effective batch size</div>
              <div>• Save checkpoints every 25-50 steps</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CodeExamples;