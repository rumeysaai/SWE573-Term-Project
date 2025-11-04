# ----- AŞAMA 1: React Uygulamasını Build Etme -----
    FROM node:18-alpine as builder

    # Çalışma dizini
    WORKDIR /app
    
    # Bağımlılıkları kopyala ve kur
    COPY package.json package-lock.json ./
    RUN npm install
    
    # Proje kodunu kopyala
    COPY . .
    
    # React uygulamasını build et
    RUN npm run build
    
    # ----- AŞAMA 2: Nginx ile Sunma -----
    FROM nginx:1.23-alpine
    
    # Build edilen statik dosyaları Nginx'in sunacağı dizine kopyala
    COPY --from=builder /app/build /usr/share/nginx/html
    
    # Varsayılan Nginx ayarını kaldır
    RUN rm /etc/nginx/conf.d/default.conf
    
    # Kendi Nginx ayarımızı kopyala
    COPY nginx.conf /etc/nginx/conf.d/
    
    # Nginx 80 portunu aç
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]