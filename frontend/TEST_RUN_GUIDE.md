# Test Çalıştırma Kılavuzu

Bu doküman, frontend testlerinin nasıl çalıştırılacağını açıklar.

## Test Yapısı

- **Unit Testler**: `src/test/unit_test/` - React Testing Library ile yazılmış unit ve integration testleri
- **E2E Testler**: `src/test/e2e/` - Playwright ile yazılmış end-to-end testleri

## Unit Testleri Çalıştırma

### Tüm Unit Testleri Çalıştırma

```bash
cd frontend
npm test
```

Bu komut watch mode'da çalışır (dosya değişikliklerini izler).

### Sadece Unit Testleri Çalıştırma

```bash
cd frontend
npm run test:unit
```

### Unit Testleri Tek Seferde Çalıştırma (CI için)

```bash
cd frontend
npm test -- --watchAll=false
```

veya

```bash
cd frontend
npm run test:unit -- --watchAll=false
```

### Belirli Bir Test Dosyasını Çalıştırma

```bash
cd frontend
npm test -- Header.test.jsx
```

### Coverage ile Çalıştırma

```bash
cd frontend
npm test -- --coverage --watchAll=false
```

### Verbose Mod (Detaylı Çıktı)

```bash
cd frontend
npm test -- --verbose
```

## E2E Testleri Çalıştırma

### Ön Gereksinimler

E2E testleri çalıştırmadan önce:
1. Backend'in çalışıyor olması gerekir (`http://localhost:8000`)
2. Frontend'in çalışıyor olması gerekir (`http://localhost:3000`)

### Tüm E2E Testleri Çalıştırma

```bash
cd frontend
npm run test:e2e
```

Bu komut otomatik olarak frontend'i başlatır (eğer çalışmıyorsa).

### E2E Testleri UI Modunda Çalıştırma (Önerilen)

```bash
cd frontend
npm run test:e2e:ui
```

Bu komut Playwright UI'ı açar ve testleri görsel olarak izleyebilirsiniz.

### E2E Testleri Headed Modda Çalıştırma (Tarayıcı Görünür)

```bash
cd frontend
npm run test:e2e:headed
```

### Belirli Bir E2E Test Dosyasını Çalıştırma

```bash
cd frontend
npx playwright test src/test/e2e/auth.spec.js
```

### Belirli Bir Tarayıcıda Çalıştırma

```bash
cd frontend
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### E2E Test Raporunu Görüntüleme

Testler çalıştıktan sonra HTML raporu oluşturulur:

```bash
cd frontend
npx playwright show-report
```

## Backend Testleri Çalıştırma

```bash
cd backend
python manage.py test
```

### Belirli Test Dosyası

```bash
cd backend
python manage.py test api.tests.test_models
python manage.py test api.tests.test_views
```

### Coverage ile

```bash
cd backend
coverage run manage.py test
coverage report
coverage html
```

## Hızlı Başlangıç

### İlk Kurulum

```bash
# Frontend dependencies
cd frontend
npm install

# Playwright browsers (ilk kez)
npx playwright install chromium
```

### Günlük Kullanım

```bash
# Unit testleri çalıştır (watch mode)
cd frontend
npm test

# E2E testleri çalıştır (UI modunda - önerilen)
cd frontend
npm run test:e2e:ui
```

## Sorun Giderme

### Unit Testler Çalışmıyor

1. `node_modules` klasörünün güncel olduğundan emin olun:
   ```bash
   cd frontend
   npm install
   ```

2. Test dosyalarının doğru konumda olduğundan emin olun: `src/test/unit_test/`

### E2E Testler Çalışmıyor

1. Backend'in çalıştığından emin olun:
   ```bash
   # Backend'i başlat
   cd backend
   python manage.py runserver
   ```

2. Frontend'in çalıştığından emin olun:
   ```bash
   # Frontend'i başlat
   cd frontend
   npm start
   ```

3. Playwright browser'larının kurulu olduğundan emin olun:
   ```bash
   cd frontend
   npx playwright install
   ```

4. `playwright.config.js` dosyasındaki `baseURL` ayarını kontrol edin.

### Test Timeout Hataları

E2E testlerinde timeout hatası alıyorsanız, `playwright.config.js` dosyasındaki timeout değerlerini artırabilirsiniz:

```javascript
use: {
  actionTimeout: 30000, // 30 saniye
  navigationTimeout: 30000,
}
```

## CI/CD için

### Unit Testler (CI)

```bash
cd frontend
npm test -- --watchAll=false --coverage
```

### E2E Testler (CI)

```bash
cd frontend
npm run test:e2e
```

CI ortamında Playwright otomatik olarak headless modda çalışır.


