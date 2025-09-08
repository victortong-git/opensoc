FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Run as root for development (fix permissions issues)
# RUN addgroup -g 1001 -S nodejs && \
#     adduser -S nodeapp -u 1001
# RUN chown -R nodeapp:nodejs /app
# USER nodeapp

# Expose port
EXPOSE 3000

# Start application in development mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]