FROM node:20-bullseye-slim

WORKDIR /app

# Copy package and lockfiles to leverage Docker layer caching
COPY package*.json ./

# Install dependencies using npm install (legacy peer deps handled or simple)
RUN npm install

# Copy all source files
COPY . .

# Build the Next.js frontend
RUN npm run build

# Default Next.js port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
