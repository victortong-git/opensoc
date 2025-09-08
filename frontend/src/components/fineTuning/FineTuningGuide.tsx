import React from 'react';
import { Code, Cpu, HardDrive, Zap, ExternalLink, Copy, CheckCircle2, Download, Settings } from 'lucide-react';

const FineTuningGuide: React.FC = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Reference Section */}
      <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <ExternalLink className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">Reference Source</span>
        </div>
        <p className="text-xs text-blue-200">
          Based on: <a 
            href="https://colab.research.google.com/github/unslothai/notebooks/blob/main/nb/gpt-oss-(20B)-Fine-tuning.ipynb" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-blue-100"
          >
            GPT-OSS (20B) Fine-tuning Notebook
          </a>
        </p>
      </div>

      {/* Hardware Requirements */}
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-opensoc-300 mb-4 flex items-center space-x-2">
          <Cpu className="w-5 h-5" />
          <span>Hardware Requirements</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-600/10 border border-green-500/20 rounded-lg p-4">
            <h4 className="font-medium text-green-300 mb-2">QLoRA (Recommended)</h4>
            <div className="space-y-1 text-sm text-gray-300">
              <div>• <strong>VRAM:</strong> 14GB minimum</div>
              <div>• <strong>Model:</strong> unsloth/gpt-oss-20b</div>
              <div>• <strong>Quantization:</strong> 4-bit (MXFP4)</div>
              <div>• <strong>Performance:</strong> 1.5x faster training</div>
            </div>
          </div>
          <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="font-medium text-yellow-300 mb-2">BF16 LoRA</h4>
            <div className="space-y-1 text-sm text-gray-300">
              <div>• <strong>VRAM:</strong> 44GB minimum</div>
              <div>• <strong>Model:</strong> unsloth/gpt-oss-20b-BF16</div>
              <div>• <strong>Precision:</strong> Full BF16</div>
              <div>• <strong>Quality:</strong> Higher precision training</div>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-opensoc-300 mb-4 flex items-center space-x-2">
          <Code className="w-5 h-5" />
          <span>Setup Instructions</span>
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-300 mb-2">1. Install Dependencies</h4>
            <div className="bg-soc-dark-900 rounded-lg p-3 relative">
              <button
                onClick={() => copyToClipboard('pip install --upgrade --force-reinstall --no-cache-dir unsloth unsloth_zoo\npip install torch transformers datasets trl peft')}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </button>
              <pre className="text-sm text-gray-300 overflow-x-auto">
{`pip install --upgrade --force-reinstall --no-cache-dir unsloth unsloth_zoo
pip install torch transformers datasets trl peft`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-300 mb-2">2. Load Model and Configure LoRA</h4>
            <div className="bg-soc-dark-900 rounded-lg p-3 relative">
              <button
                onClick={() => copyToClipboard(`from unsloth import FastLanguageModel
import torch

# Load GPT-OSS 20B with QLoRA
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/gpt-oss-20b",  # MXFP4 quantized version
    max_seq_length=16384,  # Supports up to 131k context
    dtype=None,  # Auto-detect
    load_in_4bit=True,  # Use 4-bit quantization
)

# Add LoRA adapters
model = FastLanguageModel.get_peft_model(
    model,
    r=32,  # LoRA rank
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", 
                   "gate_proj", "up_proj", "down_proj"],
    lora_alpha=16,
    lora_dropout=0.05,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=42,
)`)}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </button>
              <pre className="text-sm text-gray-300 overflow-x-auto">
{`from unsloth import FastLanguageModel
import torch

# Load GPT-OSS 20B with QLoRA
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/gpt-oss-20b",  # MXFP4 quantized version
    max_seq_length=16384,  # Supports up to 131k context
    dtype=None,  # Auto-detect
    load_in_4bit=True,  # Use 4-bit quantization
)

# Add LoRA adapters
model = FastLanguageModel.get_peft_model(
    model,
    r=32,  # LoRA rank
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", 
                   "gate_proj", "up_proj", "down_proj"],
    lora_alpha=16,
    lora_dropout=0.05,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=42,
)`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-300 mb-2">3. Export Training Data from OpenSOC</h4>
            <div className="bg-opensoc-600/10 border border-opensoc-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="w-4 h-4 text-opensoc-400" />
                <span className="text-sm font-medium text-opensoc-300">OpenSOC Export Procedure</span>
              </div>
              <div className="text-xs text-opensoc-200 space-y-1">
                <div><strong>Step 1:</strong> Navigate to "Statistics & Export" tab on this page</div>
                <div><strong>Step 2:</strong> Configure export settings:</div>
                <div className="ml-4">
                  <div>• Set date range for your training data</div>
                  <div>• Set minimum confidence to 8+ for high-quality data</div>
                  <div>• Choose JSONL format (recommended for GPT-OSS)</div>
                  <div>• Keep 70/20/10 train/validation/test split</div>
                </div>
                <div><strong>Step 3:</strong> Click "Export Training Dataset" button</div>
                <div><strong>Step 4:</strong> Extract the downloaded ZIP file containing:</div>
                <div className="ml-4">
                  <div>• <code>opensoc_training.jsonl</code> - Training examples</div>
                  <div>• <code>opensoc_validation.jsonl</code> - Validation examples</div>
                  <div>• <code>opensoc_test.jsonl</code> - Test examples</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-300 mb-2">4. Load OpenSOC Training Data</h4>
            <div className="bg-soc-dark-900 rounded-lg p-3 relative">
              <button
                onClick={() => copyToClipboard(`from datasets import Dataset
import json
import zipfile
import os

# Load OpenSOC exported training data from ZIP
def load_opensoc_export(zip_path):
    """Load OpenSOC training data from exported ZIP file"""
    data = {}
    
    with zipfile.ZipFile(zip_path, 'r') as zip_file:
        # Extract and load each split
        for split in ['training', 'validation', 'test']:
            filename = f'opensoc_{split}.jsonl'
            if filename in zip_file.namelist():
                with zip_file.open(filename) as f:
                    content = f.read().decode('utf-8')
                    data[split] = [json.loads(line) for line in content.strip().split('\\n') if line.strip()]
                print(f"Loaded {len(data[split])} {split} examples")
            else:
                print(f"Warning: {filename} not found in export")
                data[split] = []
    
    return data

# Validate OpenSOC data format
def validate_opensoc_format(data_split, split_name):
    """Validate exported OpenSOC data structure"""
    required_fields = ['instruction', 'input', 'output', 'metadata']
    
    for i, example in enumerate(data_split[:3]):  # Check first 3
        missing = [f for f in required_fields if f not in example]
        if missing:
            print(f"{split_name}[{i}]: Missing {missing}")
        else:
            # Parse OpenSOC input/output
            try:
                input_data = json.loads(example['input'])
                output_data = json.loads(example['output'])
                confidence = example['metadata'].get('confidence_score', 0)
                print(f"{split_name}[{i}]: ✅ Valid (confidence: {confidence})")
            except Exception as e:
                print(f"{split_name}[{i}]: ❌ Parse error: {e}")

# Load your OpenSOC export (download from Statistics & Export tab)
export_data = load_opensoc_export('fine-tuning-dataset-2025-01-15.zip')

# Validate data quality
for split_name, split_data in export_data.items():
    validate_opensoc_format(split_data, split_name)

# Convert to Hugging Face dataset format
def format_opensoc_prompt(example):
    """Format OpenSOC security alert for GPT-OSS training"""
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

# Create datasets for training
train_dataset = Dataset.from_list(export_data['training']).map(format_opensoc_prompt)
val_dataset = Dataset.from_list(export_data['validation']).map(format_opensoc_prompt)
test_dataset = Dataset.from_list(export_data['test']).map(format_opensoc_prompt)

print(f"\\nDatasets ready:")
print(f"Training: {len(train_dataset)} examples")
print(f"Validation: {len(val_dataset)} examples") 
print(f"Test: {len(test_dataset)} examples")`)}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </button>
              <pre className="text-sm text-gray-300 overflow-x-auto">
{`from datasets import Dataset
import json
import zipfile
import os

# Load OpenSOC exported training data from ZIP
def load_opensoc_export(zip_path):
    """Load OpenSOC training data from exported ZIP file"""
    data = {}
    
    with zipfile.ZipFile(zip_path, 'r') as zip_file:
        # Extract and load each split
        for split in ['training', 'validation', 'test']:
            filename = f'opensoc_{split}.jsonl'
            if filename in zip_file.namelist():
                with zip_file.open(filename) as f:
                    content = f.read().decode('utf-8')
                    data[split] = [json.loads(line) for line in content.strip().split('\\n') if line.strip()]
                print(f"Loaded {len(data[split])} {split} examples")
            else:
                print(f"Warning: {filename} not found in export")
                data[split] = []
    
    return data

# Validate OpenSOC data format
def validate_opensoc_format(data_split, split_name):
    """Validate exported OpenSOC data structure"""
    required_fields = ['instruction', 'input', 'output', 'metadata']
    
    for i, example in enumerate(data_split[:3]):  # Check first 3
        missing = [f for f in required_fields if f not in example]
        if missing:
            print(f"{split_name}[{i}]: Missing {missing}")
        else:
            # Parse OpenSOC input/output
            try:
                input_data = json.loads(example['input'])
                output_data = json.loads(example['output'])
                confidence = example['metadata'].get('confidence_score', 0)
                print(f"{split_name}[{i}]: ✅ Valid (confidence: {confidence})")
            except Exception as e:
                print(f"{split_name}[{i}]: ❌ Parse error: {e}")

# Load your OpenSOC export (download from Statistics & Export tab)
export_data = load_opensoc_export('fine-tuning-dataset-2025-01-15.zip')

# Validate data quality
for split_name, split_data in export_data.items():
    validate_opensoc_format(split_data, split_name)

# Convert to Hugging Face dataset format
def format_opensoc_prompt(example):
    """Format OpenSOC security alert for GPT-OSS training"""
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

# Create datasets for training
train_dataset = Dataset.from_list(export_data['training']).map(format_opensoc_prompt)
val_dataset = Dataset.from_list(export_data['validation']).map(format_opensoc_prompt)
test_dataset = Dataset.from_list(export_data['test']).map(format_opensoc_prompt)

print(f"\\nDatasets ready:")
print(f"Training: {len(train_dataset)} examples")
print(f"Validation: {len(val_dataset)} examples") 
print(f"Test: {len(test_dataset)} examples")`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-300 mb-2">5. Configure Training</h4>
            <div className="bg-soc-dark-900 rounded-lg p-3 relative">
              <button
                onClick={() => copyToClipboard(`from trl import SFTTrainer
from transformers import TrainingArguments

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
        max_steps=100,  # Adjust based on dataset size
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=1,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=42,
        output_dir="opensoc_gpt_oss_finetuned",
        eval_strategy="steps",
        eval_steps=50,
        save_steps=50,
        load_best_model_at_end=True,
    ),
)

# Start training
trainer.train()`)}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </button>
              <pre className="text-sm text-gray-300 overflow-x-auto">
{`from trl import SFTTrainer
from transformers import TrainingArguments

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
        max_steps=100,  # Adjust based on dataset size
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=1,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=42,
        output_dir="opensoc_gpt_oss_finetuned",
        eval_strategy="steps",
        eval_steps=50,
        save_steps=50,
        load_best_model_at_end=True,
    ),
)

# Start training
trainer.train()`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-300 mb-2">6. Save and Export Model</h4>
            <div className="bg-soc-dark-900 rounded-lg p-3 relative">
              <button
                onClick={() => copyToClipboard(`# Save the fine-tuned model
model.save_pretrained("opensoc_gpt_oss_lora")
tokenizer.save_pretrained("opensoc_gpt_oss_lora")

# Optional: Merge LoRA weights for deployment
model.save_pretrained_merged("opensoc_gpt_oss_merged", tokenizer)

# Optional: Push to Hugging Face
# model.push_to_hub_merged("your-username/opensoc-gpt-oss", 
#                         tokenizer=tokenizer, 
#                         token="your_hf_token")`)}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </button>
              <pre className="text-sm text-gray-300 overflow-x-auto">
{`# Save the fine-tuned model
model.save_pretrained("opensoc_gpt_oss_lora")
tokenizer.save_pretrained("opensoc_gpt_oss_lora")

# Optional: Merge LoRA weights for deployment
model.save_pretrained_merged("opensoc_gpt_oss_merged", tokenizer)

# Optional: Push to Hugging Face
# model.push_to_hub_merged("your-username/opensoc-gpt-oss", 
#                         tokenizer=tokenizer, 
#                         token="your_hf_token")`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* OpenSOC Data Format */}
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-opensoc-300 mb-4 flex items-center space-x-2">
          <HardDrive className="w-5 h-5" />
          <span>OpenSOC Training Data Format</span>
        </h3>
        
        <div className="space-y-4">
          <div className="bg-green-600/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">✅ OpenSOC Data is GPT-OSS Compatible</span>
            </div>
            <p className="text-xs text-green-200">
              OpenSOC exports instruction-tuning format with security context input and human-verified classification output.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-300 mb-2">Example OpenSOC JSONL Record</h4>
            <div className="bg-soc-dark-900 rounded-lg p-3 relative">
              <button
                onClick={() => copyToClipboard(`{
  "instruction": "Analyze this security alert and provide classification, tags, risk assessment, and recommended actions.",
  "input": "{\\"alert_title\\":\\"Suspicious Network Activity Detected\\",\\"alert_description\\":\\"Multiple failed authentication attempts from IP 192.168.1.100\\",\\"severity\\":3,\\"source_system\\":\\"SIEM\\",\\"event_timestamp\\":\\"2025-01-15T10:30:00Z\\",\\"raw_log_data\\":\\"{\\\\\\"src_ip\\\\\\":\\\\\\"192.168.1.100\\\\\\",\\\\\\"failed_attempts\\\\\\":15,\\\\\\"time_window\\\\\\":\\\\\\"5min\\\\\\"}\\"}",
  "output": "{\\"security_event_type\\":\\"brute_force_attack\\",\\"event_tags\\":[{\\"tag\\":\\"authentication\\",\\"confidence\\":0.95},{\\"tag\\":\\"brute_force\\",\\"confidence\\":0.89}],\\"risk_assessment\\":\\"medium\\",\\"recommended_actions\\":[\\"Block source IP\\",\\"Review authentication logs\\",\\"Check for successful logins\\"]}",
  "metadata": {
    "alert_id": "550e8400-e29b-41d4-a716-446655440001",
    "review_status": "verified", 
    "confidence_score": 9,
    "human_verified": true
  }
}`)}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </button>
              <pre className="text-sm text-gray-300 overflow-x-auto">
{`{
  "instruction": "Analyze this security alert and provide classification, tags, risk assessment, and recommended actions.",
  "input": "{\\"alert_title\\":\\"Suspicious Network Activity Detected\\",\\"alert_description\\":\\"Multiple failed authentication attempts from IP 192.168.1.100\\",\\"severity\\":3,\\"source_system\\":\\"SIEM\\",\\"event_timestamp\\":\\"2025-01-15T10:30:00Z\\",\\"raw_log_data\\":\\"{\\\\\\"src_ip\\\\\\":\\\\\\"192.168.1.100\\\\\\",\\\\\\"failed_attempts\\\\\\":15,\\\\\\"time_window\\\\\\":\\\\\\"5min\\\\\\"}\\"}",
  "output": "{\\"security_event_type\\":\\"brute_force_attack\\",\\"event_tags\\":[{\\"tag\\":\\"authentication\\",\\"confidence\\":0.95},{\\"tag\\":\\"brute_force\\",\\"confidence\\":0.89}],\\"risk_assessment\\":\\"medium\\",\\"recommended_actions\\":[\\"Block source IP\\",\\"Review authentication logs\\",\\"Check for successful logins\\"]}",
  "metadata": {
    "alert_id": "550e8400-e29b-41d4-a716-446655440001",
    "review_status": "verified", 
    "confidence_score": 9,
    "human_verified": true
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Training Configuration */}
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-opensoc-300 mb-4 flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>Recommended Training Parameters</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-300">LoRA Configuration</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>• <strong>Rank (r):</strong> 32 (balance between quality and speed)</div>
                <div>• <strong>Alpha:</strong> 16 (LoRA scaling factor)</div>
                <div>• <strong>Dropout:</strong> 0.05 (prevent overfitting)</div>
                <div>• <strong>Target Modules:</strong> All attention and MLP layers</div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-300">Training Settings</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>• <strong>Learning Rate:</strong> 2e-4</div>
                <div>• <strong>Batch Size:</strong> 1 (with 4x gradient accumulation)</div>
                <div>• <strong>Max Steps:</strong> 100-500 (based on dataset size)</div>
                <div>• <strong>Optimizer:</strong> AdamW 8-bit</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-300">Memory Optimization</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>• <strong>Gradient Checkpointing:</strong> "unsloth" mode</div>
                <div>• <strong>Precision:</strong> BF16 or FP16</div>
                <div>• <strong>Sequence Length:</strong> 16,384 tokens</div>
                <div>• <strong>4-bit Quantization:</strong> Enabled for QLoRA</div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-300">Dataset Recommendations</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>• <strong>Minimum Size:</strong> 100+ high-quality examples</div>
                <div>• <strong>Optimal Size:</strong> 1,000+ examples</div>
                <div>• <strong>Quality Threshold:</strong> Confidence ≥ 8/10</div>
                <div>• <strong>Verification:</strong> Human-reviewed preferred</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inference Example */}
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-opensoc-300 mb-4">Using Your Fine-Tuned Model</h3>
        
        <div className="bg-soc-dark-900 rounded-lg p-3 relative">
          <button
            onClick={() => copyToClipboard(`# Load your fine-tuned model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="opensoc_gpt_oss_merged",  # Your saved model
    max_seq_length=16384,
    dtype=None,
    load_in_4bit=True,
)

# Enable fast inference
FastLanguageModel.for_inference(model)

# Example security alert analysis
alert_data = {
    "alert_title": "Unusual Process Execution",
    "alert_description": "Unknown process calc.exe executed from temp directory",
    "severity": 4,
    "source_system": "EDR",
    "raw_log_data": "{\\"process\\":\\"calc.exe\\",\\"path\\":\\"/tmp/\\",\\"user\\":\\"admin\\"}"
}

messages = [
    {"role": "user", "content": f"Analyze this security alert:\\n{json.dumps(alert_data)}"}
]

inputs = tokenizer.apply_chat_template(
    messages,
    tokenize=True,
    add_generation_prompt=True,
    return_tensors="pt"
).to("cuda")

# Generate analysis
outputs = model.generate(
    input_ids=inputs,
    max_new_tokens=512,
    use_cache=True,
    temperature=0.7,
    do_sample=True
)

response = tokenizer.decode(outputs[0][inputs.shape[-1]:], skip_special_tokens=True)
print(response)`)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
          >
            <Copy className="w-4 h-4" />
          </button>
          <pre className="text-sm text-gray-300 overflow-x-auto">
{`# Load your fine-tuned model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="opensoc_gpt_oss_merged",  # Your saved model
    max_seq_length=16384,
    dtype=None,
    load_in_4bit=True,
)

# Enable fast inference
FastLanguageModel.for_inference(model)

# Example security alert analysis
alert_data = {
    "alert_title": "Unusual Process Execution",
    "alert_description": "Unknown process calc.exe executed from temp directory",
    "severity": 4,
    "source_system": "EDR",
    "raw_log_data": "{\\"process\\":\\"calc.exe\\",\\"path\\":\\"/tmp/\\",\\"user\\":\\"admin\\"}"
}

messages = [
    {"role": "user", "content": f"Analyze this security alert:\\n{json.dumps(alert_data)}"}
]

inputs = tokenizer.apply_chat_template(
    messages,
    tokenize=True,
    add_generation_prompt=True,
    return_tensors="pt"
).to("cuda")

# Generate analysis
outputs = model.generate(
    input_ids=inputs,
    max_new_tokens=512,
    use_cache=True,
    temperature=0.7,
    do_sample=True
)

response = tokenizer.decode(outputs[0][inputs.shape[-1]:], skip_special_tokens=True)
print(response)`}
          </pre>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-opensoc-300 mb-4">Best Practices for SOC Fine-Tuning</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Data Quality</h4>
            <div className="text-xs text-gray-400 space-y-1">
              <div>• Use only high-confidence human feedback (8-10/10)</div>
              <div>• Include diverse security event types</div>
              <div>• Balance positive and negative examples</div>
              <div>• Ensure consistent labeling standards</div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Training Strategy</h4>
            <div className="text-xs text-gray-400 space-y-1">
              <div>• Start with small learning rates (2e-4)</div>
              <div>• Monitor validation loss for overfitting</div>
              <div>• Use early stopping when validation improves</div>
              <div>• Save checkpoints regularly during training</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FineTuningGuide;