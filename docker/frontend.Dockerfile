FROM node:18-alpine

WORKDIR /app/frontend

COPY frontend/package.json ./
COPY frontend/package-lock.json ./

RUN npm install

COPY frontend/ ./

EXPOSE 19006

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "19006"]
