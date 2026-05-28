FROM node:20-alpine

WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install --legacy-peer-deps --ignore-engines

# Copia todo o restante dos arquivos do projeto (incluindo a pasta prisma/)
COPY . .

# [ADICIONADO E CORRIGIDO AQUI] Gera o cliente do Prisma dentro da estrutura do Docker
RUN npx prisma generate

# Agora sim, compila os arquivos TypeScript sem erros de tipos ausentes
RUN npm run build

# Expõe a porta que a sua API Fastify escuta
EXPOSE 8081

# Comando para rodar a aplicação em produção
CMD ["node", "dist/index.js"]