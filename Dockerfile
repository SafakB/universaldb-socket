FROM node:18-alpine

# Çalışma dizinini ayarla
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# package-lock.json varsa npm ci, yoksa npm install kullan
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Uygulama kodunu kopyala
COPY . .

# Port'u expose et
EXPOSE 3001

# Uygulamayı başlat
CMD ["npm", "start"]