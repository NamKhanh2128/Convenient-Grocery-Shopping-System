FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package configuration files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of the application files
COPY . .

# Set default port and export environment variable
ENV PORT=3000
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
