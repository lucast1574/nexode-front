FROM node:20-bullseye-slim

WORKDIR /app

# Copy package and lockfiles to leverage Docker layer caching
COPY package*.json ./

# Install dependencies using npm install (legacy peer deps handled or simple)
RUN npm install

# Copy all source files
COPY . .

# Next.js needs NEXT_PUBLIC_* at build time (they get embedded in the JS bundle)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}

# Build the Next.js frontend
RUN npm run build

# Default Next.js port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
