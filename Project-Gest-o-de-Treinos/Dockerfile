FROM node:24-slim

# Instala openssl para o Prisma funcionar perfeitamente no ambiente Linux Slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia os arquivos de definição de dependências primeiro
COPY package*.json ./

# Instala dependências ignorando conflitos estritos de peer dependencies
RUN npm install --legacy-peer-deps

# Copia todo o código do projeto para dentro do container
COPY . .

# Gera os artefatos do Prisma Client no caminho customizado antes de compilar o código
RUN npx prisma generate

# Compila os arquivos TypeScript da pasta src/ para JavaScript nativo dentro da pasta dist/
RUN npm run build

# Expõe a porta que a sua API Fastify escuta
EXPOSE 8081

# Executa as migrações oficiais de produção no banco do Render e inicia o servidor JavaScript puro
CMD sh -c "npx prisma migrate deploy && node dist/index.js"