# Setting up Ollama Provider for NVIDIA AI Toolkit

This guide provides step-by-step instructions for adding Ollama support to NVIDIA AI Toolkit, enabling you to use local Ollama models instead of cloud-based NIM services.

## Prerequisites

- Running NVIDIA AI Toolkit container
- Access to Ollama server (local or remote)
- Basic understanding of AI Toolkit configuration

## Setup Methods

There are two approaches to integrate Ollama with AI Toolkit:

### Method 1: OpenAI-Compatible API (Recommended)

This is the simplest approach using Ollama's built-in OpenAI-compatible API endpoint.

#### Configuration

In your AI Toolkit configuration YAML file, replace NIM configurations with:

```yaml
llms:
  ollama_llm:
    _type: openai
    base_url: http://192.168.8.21:11434/v1  # Your Ollama server URL + /v1
    api_key: "not-needed"                    # Ollama doesn't require API key
    model_name: gpt-oss:20b                   # Your Ollama model name
    temperature: 0.0
    max_tokens: 512
```

#### Example Usage

```bash
docker compose exec aiqtoolkit bash -c 'aiq run --config_file examples/evaluation_and_profiling/email_phishing_analyzer/configs/config.yml --input "Your test input here"'
```

### Method 2: Native Ollama Provider (Advanced)

For direct Ollama integration, you can create a custom Ollama provider.

#### Step 1: Create Ollama Provider

Create `/workspace/src/aiq/llm/ollama_llm.py`:

```python
# SPDX-FileCopyrightText: Copyright (c) 2024-2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

from pydantic import AliasChoices, ConfigDict, Field, PositiveInt
from aiq.builder.builder import Builder
from aiq.builder.llm import LLMProviderInfo
from aiq.cli.register_workflow import register_llm_provider
from aiq.data_models.llm import LLMBaseConfig
from aiq.data_models.retry_mixin import RetryMixin

class OllamaModelConfig(LLMBaseConfig, RetryMixin, name="ollama"):
    """An Ollama LLM provider to be used with an LLM client."""
    
    model_config = ConfigDict(protected_namespaces=())
    
    base_url: str = Field(default="http://localhost:11434", description="Base url to the Ollama server.")
    model_name: str = Field(validation_alias=AliasChoices("model_name", "model"),
                            serialization_alias="model",
                            description="The model name for Ollama.")
    temperature: float = Field(default=0.0, description="Sampling temperature in [0, 1].")
    top_p: float = Field(default=1.0, description="Top-p for distribution sampling.")
    max_tokens: PositiveInt = Field(default=300, description="Maximum number of tokens to generate.")

@register_llm_provider(config_type=OllamaModelConfig)
async def ollama_model(llm_config: OllamaModelConfig, builder: Builder):
    yield LLMProviderInfo(config=llm_config, description="An Ollama model for use with an LLM client.")
```

#### Step 2: Register Provider

Update `/workspace/src/aiq/llm/register.py`:

```python
# Import any providers which need to be automatically registered here
from . import aws_bedrock_llm
from . import nim_llm
from . import ollama_llm  # Add this line
from . import openai_llm
```

#### Step 3: Add Client Registrations

Add LangChain client in `/workspace/packages/nvidia_nat_langchain/src/aiq/plugins/langchain/llm.py`:

```python
from aiq.llm.ollama_llm import OllamaModelConfig  # Add import

@register_llm_client(config_type=OllamaModelConfig, wrapper_type=LLMFrameworkEnum.LANGCHAIN)
async def ollama_langchain(llm_config: OllamaModelConfig, builder: Builder):
    from langchain_ollama import ChatOllama
    
    client = ChatOllama(**llm_config.model_dump(exclude={"type"}, by_alias=True))
    
    if isinstance(llm_config, RetryMixin):
        client = patch_with_retry(client,
                                  retries=llm_config.num_retries,
                                  retry_codes=llm_config.retry_on_status_codes,
                                  retry_on_messages=llm_config.retry_on_errors)
    yield client
```

Add LlamaIndex client in `/workspace/packages/nvidia_nat_llama_index/src/aiq/plugins/llama_index/llm.py`:

```python
from aiq.llm.ollama_llm import OllamaModelConfig  # Add import

@register_llm_client(config_type=OllamaModelConfig, wrapper_type=LLMFrameworkEnum.LLAMA_INDEX)
async def ollama_llama_index(llm_config: OllamaModelConfig, builder: Builder):
    from llama_index.llms.ollama import Ollama
    
    kwargs = llm_config.model_dump(exclude={"type"}, by_alias=True)
    
    if ("base_url" in kwargs and kwargs["base_url"] is None):
        del kwargs["base_url"]
    
    llm = Ollama(**kwargs)
    
    if isinstance(llm_config, RetryMixin):
        llm = patch_with_retry(llm,
                               retries=llm_config.num_retries,
                               retry_codes=llm_config.retry_on_status_codes,
                               retry_on_messages=llm_config.retry_on_errors)
    yield llm
```

#### Step 4: Install Dependencies

```bash
# Install required packages
pip install langchain-ollama llama-index-llms-ollama

# Reinstall local modifications
cd /workspace && pip install -e .
```

#### Step 5: Configuration

Use the native Ollama provider:

```yaml
llms:
  ollama_llm:
    _type: ollama
    base_url: http://192.168.8.21:11434
    model_name: gpt-oss:20b
    temperature: 0.0
    max_tokens: 512
```

## Configuration Parameters

### Common Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `base_url` | Ollama server URL | `http://localhost:11434` | Yes |
| `model_name` | Name of the Ollama model | - | Yes |
| `temperature` | Sampling temperature (0-1) | `0.0` | No |
| `max_tokens` | Maximum tokens to generate | `300`/`512` | No |
| `top_p` | Top-p sampling parameter | `1.0` | No |

### Method-Specific Parameters

#### OpenAI-Compatible Mode
- `api_key`: Set to `"not-needed"` (Ollama doesn't require authentication)
- `base_url`: Must include `/v1` suffix (e.g., `http://192.168.8.21:11434/v1`)

#### Native Ollama Mode
- `base_url`: Direct Ollama URL without `/v1` suffix
- No `api_key` parameter needed

## Example Configurations

### Complete Configuration File

```yaml
# config.yml
general:
  use_uvloop: true
  telemetry:
    logging:
      console:
        _type: console
        level: WARN

functions:
  email_phishing_analyzer:
    _type: email_phishing_analyzer
    llm: ollama_llm
    prompt: |
      Examine the following email content and determine if it exhibits signs of malicious intent.
      
      Email content:
      {body}
      
      Return your findings as a JSON object with these fields:
      - is_likely_phishing: (boolean) true if phishing is suspected
      - explanation: (string) detailed explanation of your reasoning

llms:
  ollama_llm:
    _type: openai  # or "ollama" for native mode
    base_url: http://192.168.8.21:11434/v1
    api_key: "not-needed"
    model_name: gpt-oss:20b
    temperature: 0.0
    max_tokens: 512

workflow:
  _type: react_agent
  tool_names:
    - email_phishing_analyzer
  llm_name: ollama_llm
  verbose: true
```

### Multiple Models Configuration

```yaml
llms:
  ollama_main:
    _type: openai
    base_url: http://192.168.8.21:11434/v1
    api_key: "not-needed"
    model_name: gpt-oss:20b
    temperature: 0.0
    max_tokens: 512
    
  ollama_small:
    _type: openai
    base_url: http://192.168.8.21:11434/v1
    api_key: "not-needed"
    model_name: gemma2:2b
    temperature: 0.1
    max_tokens: 256
```

## Testing Your Setup

### Basic Test

```bash
# Test that Ollama provider is available
docker compose exec aiqtoolkit bash -c 'aiq info components -t llm_provider'

# Run example with your configuration
docker compose exec aiqtoolkit bash -c 'aiq run --config_file your_config.yml --input "Test message"'
```

### Phishing Analyzer Example

```bash
# Test the email phishing analyzer
docker compose exec aiqtoolkit bash -c 'aiq run --config_file examples/evaluation_and_profiling/email_phishing_analyzer/configs/config.yml --input "Dear [Customer], Thank you for your purchase on [Date]. We have processed a refund of \$[Amount] to your account. Please provide your account and routing numbers so we can complete the transaction. Thank you, [Your Company]"'
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Verify Ollama server is running on specified host/port
   - Check firewall settings
   - Test connection with `curl http://192.168.8.21:11434/api/tags`

2. **Model Not Found**
   - Verify model is installed: `ollama list`
   - Pull model if needed: `ollama pull gpt-oss:20b`

3. **Import Errors (Native Mode)**
   - Install dependencies: `pip install langchain-ollama llama-index-llms-ollama`
   - Reinstall local packages: `cd /workspace && pip install -e .`

4. **Provider Not Registered**
   - Restart AI Toolkit container: `docker compose restart`
   - Check provider registration: `aiq info components -t llm_provider`

### Debug Commands

```bash
# Check Ollama server status
curl http://192.168.8.21:11434/api/tags

# Test OpenAI-compatible endpoint
curl http://192.168.8.21:11434/v1/models

# List available AI Toolkit providers
docker compose exec aiqtoolkit bash -c 'aiq info components -t llm_provider'

# List available AI Toolkit clients
docker compose exec aiqtoolkit bash -c 'aiq info components -t llm_client'
```

## Performance Considerations

- **Model Size**: Larger models (like `gpt-oss:20b`) provide better results but require more memory
- **Network Latency**: Local Ollama instances provide faster response times
- **Concurrent Requests**: Ollama can handle multiple concurrent requests depending on available resources
- **Token Limits**: Set appropriate `max_tokens` based on your use case and model capabilities

## Security Considerations

- **API Keys**: Ollama doesn't require API keys, but ensure proper network security
- **Network Access**: Restrict Ollama server access to trusted networks
- **Model Validation**: Verify model integrity and sources before deployment

## Integration Tips

1. **Start with OpenAI-Compatible Mode**: It's simpler and works with existing AI Toolkit configurations
2. **Test Thoroughly**: Validate responses with your specific use cases
3. **Monitor Performance**: Track response times and quality metrics
4. **Version Control**: Keep configuration files in version control
5. **Documentation**: Document your specific model choices and parameters

## Next Steps

After successful setup:

1. Create custom functions that leverage your Ollama models
2. Implement evaluation workflows to test model performance
3. Scale to multiple Ollama instances for production workloads
4. Integrate with your existing CI/CD pipelines

## Support

For additional support:
- NVIDIA AI Toolkit Documentation: [https://docs.nvidia.com/aiqtoolkit/](https://docs.nvidia.com/aiqtoolkit/)
- Ollama Documentation: [https://ollama.ai/docs](https://ollama.ai/docs)
- GitHub Issues: Report problems in your project repository

---

This documentation was generated to help integrate Ollama with NVIDIA AI Toolkit. Update the URLs, model names, and other parameters according to your specific environment.