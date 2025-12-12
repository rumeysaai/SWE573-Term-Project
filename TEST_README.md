# Test Kılavuzu

Bu doküman, projede yazılan testlerin nasıl çalıştırılacağını açıklar.

## Test Yapısı

### Backend Tests (Django)
- **Konum**: `backend/api/tests/`
- **Test Dosyaları**:
  - `test_models.py`: Model unit testleri
  - `test_views.py`: API endpoint integration testleri

### Frontend Tests (React)
- **Unit Testler Konum**: `frontend/src/test/unit_test/`
  - `api.test.js`: API utility testleri
  - `App.test.jsx`: App component integration testleri
  - `routing.test.jsx`: Routing testleri
  - `ui-interactions.test.jsx`: UI interaction testleri
  - `Login.test.jsx`: Login page testleri
  - `Signup.test.jsx`: Signup page testleri
  - `Home.test.jsx`: Home page testleri
  - `Header.test.jsx`: Header component testleri

- **E2E Testler Konum**: `frontend/src/test/e2e/`
  - `auth.spec.js`: Authentication flow testleri
  - `navigation.spec.js`: Navigation testleri
  - `posts.spec.js`: Posts functionality testleri
  - `forum.spec.js`: Forum functionality testleri
  - `profile.spec.js`: Profile functionality testleri

## Test Çalıştırma

### Backend Tests

```bash
# Backend dizinine git
cd backend

# Tüm testleri çalıştır
python manage.py test

# Belirli bir test dosyasını çalıştır
python manage.py test api.tests.test_models
python manage.py test api.tests.test_views

# Belirli bir test sınıfını çalıştır
python manage.py test api.tests.test_models.ProfileModelTest

# Belirli bir test metodunu çalıştır
python manage.py test api.tests.test_models.ProfileModelTest.test_profile_auto_creation

# Verbose mod (detaylı çıktı)
python manage.py test --verbosity=2

# Coverage ile çalıştır (coverage paketi gerekli)
coverage run manage.py test
coverage report
coverage html  # HTML raporu oluştur
```

### Frontend Tests

#### Unit Testleri

```bash
# Frontend dizinine git
cd frontend

# Tüm unit testleri çalıştır (watch mode)
npm test

# Sadece unit testleri çalıştır
npm run test:unit

# Tüm testleri bir kez çalıştır (CI için)
npm test -- --watchAll=false

# Coverage ile çalıştır
npm test -- --coverage --watchAll=false

# Belirli bir test dosyasını çalıştır
npm test -- Header.test.jsx

# Verbose mod
npm test -- --verbose
```

#### E2E Testleri (Playwright)

```bash
# Frontend dizinine git
cd frontend

# Tüm E2E testleri çalıştır
npm run test:e2e

# E2E testleri UI modunda çalıştır (önerilen)
npm run test:e2e:ui

# E2E testleri headed modda çalıştır (tarayıcı görünür)
npm run test:e2e:headed

# Belirli bir E2E test dosyasını çalıştır
npx playwright test src/test/e2e/auth.spec.js

# Belirli bir tarayıcıda çalıştır
npx playwright test --project=chromium

# Test raporunu görüntüle
npx playwright show-report
```

**Not**: E2E testleri çalıştırmadan önce backend (`localhost:8000`) ve frontend (`localhost:3000`) çalışıyor olmalı.

## Test Kapsamı

### Backend Test Coverage

#### Model Tests (`test_models.py`)
- ✅ Profile model (auto-creation, validations, review averages)
- ✅ Tag model (creation, auto-increment, uniqueness)
- ✅ Post model (creation, types, tags, coordinates)
- ✅ Proposal model (creation, status transitions, balance operations)
- ✅ Review model (creation, validations, unique constraints)
- ✅ Chat & Message models (creation, read status)
- ✅ Forum models (topic, comment creation)

#### API Tests (`test_views.py`)
- ✅ Authentication (register, login, logout, session)
- ✅ Post API (CRUD, filtering, searching)
- ✅ Comment API (CRUD, reporting)
- ✅ Proposal API (CRUD, status transitions, balance operations)
- ✅ Review API (creation, filtering)
- ✅ Chat API (creation, messaging)
- ✅ Forum API (topic, comment CRUD)
- ✅ Profile API (get, update)

### Frontend Test Coverage

#### Component Tests
- ✅ Header component (rendering, navigation, admin check, logout)
- ✅ Login page (form rendering, validation, submission, error handling)
- ✅ Signup page (form rendering, validation, password mismatch, API integration)
- ✅ Home page (rendering, data fetching, filtering, searching)

#### Integration Tests
- ✅ API utility (axios configuration, CSRF handling)
- ✅ App component (initialization, session check)
- ✅ Routing (protected routes, public routes, redirects)

#### UI Tests
- ✅ Form interactions (filling, submitting)
- ✅ Navigation (links, redirects)
- ✅ Error handling (validation errors, API errors)

## Test Verileri

### Backend
- Testler Django'nun test database'ini kullanır
- Her test bağımsız çalışır (transaction rollback)
- Factory pattern veya setUp metodları ile test verileri oluşturulur

### Frontend
- Testler mock API kullanır
- User interactions `@testing-library/user-event` ile simüle edilir
- Router `MemoryRouter` ile mock edilir

## Test Geliştirme İpuçları

### Backend
1. Her model için en az bir test sınıfı oluştur
2. API endpoint'leri için hem başarılı hem de hata senaryolarını test et
3. Permission kontrollerini test et (authenticated, admin, owner)
4. Validation hatalarını test et

### Frontend
1. Component'leri izole ederek test et
2. User interactions'ı `userEvent` ile simüle et
3. API çağrılarını mock'la
4. Error handling senaryolarını test et
5. Loading states'i test et

## CI/CD Entegrasyonu

Testler CI/CD pipeline'ında otomatik çalıştırılmalıdır:

```yaml
# Örnek GitHub Actions workflow
- name: Run Backend Tests
  run: |
    cd backend
    python manage.py test

- name: Run Frontend Tests
  run: |
    cd frontend
    npm test -- --watchAll=false --coverage
```

## Sorun Giderme

### Backend
- **Import hataları**: Django'nun doğru kurulduğundan emin ol
- **Database hataları**: Test database ayarlarını kontrol et
- **Permission hataları**: Test client'ın doğru authenticate edildiğinden emin ol

### Frontend
- **Module not found**: `node_modules` klasörünün güncel olduğundan emin ol (`npm install`)
- **Mock hataları**: Mock'ların doğru import edildiğinden emin ol
- **Router hataları**: `MemoryRouter` veya `BrowserRouter` kullanıldığından emin ol

## Test Yazma Standartları

1. **Test isimleri açıklayıcı olmalı**: `test_user_can_login_with_valid_credentials`
2. **Her test tek bir şeyi test etmeli**
3. **Arrange-Act-Assert pattern kullan**
4. **Mock'ları doğru kullan**
5. **Edge case'leri test et**

## Ek Kaynaklar

- [Django Testing](https://docs.djangoproject.com/en/stable/topics/testing/)
- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

