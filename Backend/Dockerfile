FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Expose backend API port
EXPOSE 5000

# Set environment explicitly
ENV NODE_ENV=production

# Run start script that points to src/index.js
CMD ["npm", "start"]
