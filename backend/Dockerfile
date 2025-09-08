FROM node:18-slim

# Set working directory
WORKDIR /app

# Install system dependencies for glibc compatibility and ONNX Runtime
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    apt-transport-https \
    gnupg \
    lsb-release \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies permanently as system packages
RUN pip3 install --no-cache-dir --break-system-packages \
    numpy==2.3.2 \
    sentence-transformers==5.1.0 \
    xformers==0.0.32.post2 \
    torch>=2.0.0 \
    transformers>=4.41.0 \
    scikit-learn \
    scipy \
    pillow

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Create cache directory for HuggingFace models
# Model will be downloaded on first use
RUN mkdir -p /app/.cache/huggingface

# Copy source code
COPY . .

# Skip build - run in dev mode with ts-node

# Create non-root user (Debian style)
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodeapp

# Create cache directories and set permissions
RUN mkdir -p /home/nodeapp/.cache/huggingface && \
    mkdir -p /home/nodeapp/.local/lib/python3.11/site-packages && \
    chmod -R 755 /home/nodeapp/.cache && \
    chmod -R 755 /home/nodeapp/.local && \
    chown -R nodeapp:nodejs /app && \
    chown -R nodeapp:nodejs /home/nodeapp

# Set environment variables for HuggingFace cache and Python packages
ENV HF_HOME=/home/nodeapp/.cache/huggingface
ENV TRANSFORMERS_CACHE=/home/nodeapp/.cache/huggingface
ENV HUGGINGFACE_HUB_CACHE=/home/nodeapp/.cache/huggingface
ENV PYTHONPATH=/usr/local/lib/python3.11/site-packages:/usr/lib/python3/dist-packages
ENV XFORMERS_DISABLED=1

USER nodeapp

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start application
CMD ["npm", "run", "dev"]