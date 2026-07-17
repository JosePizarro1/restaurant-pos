FROM node:20

WORKDIR /app

# Copiar solo package files primero (para cache de layers)
COPY package.json package-lock.json* ./

# Instalar dependencias Linux-native (sin sobreescribir nada)
RUN npm install --legacy-peer-deps && npm install @rolldown/binding-linux-x64-gnu --legacy-peer-deps

# Copiar el resto del código fuente
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
