# Test Plan - SWE573 Term Project

## 1. Overview
Bu doküman, SWE573 Term Project için kapsamlı test planını içermektedir. Test planı üç ana kategoriyi kapsar:
- **Unit Tests**: Bireysel fonksiyon ve component'lerin test edilmesi
- **Integration Tests**: Sistem bileşenlerinin birlikte çalışmasının test edilmesi
- **UI Tests**: Kullanıcı arayüzü ve kullanıcı etkileşimlerinin test edilmesi

## 2. Backend Tests (Django REST Framework)

### 2.1 Unit Tests

#### 2.1.1 Model Tests
- **Profile Model**
  - Profile oluşturma ve User ile ilişki
  - `get_review_averages()` metodunun doğruluğu
  - Time balance validasyonları (0-10 arası)
  - Profile signal'larının çalışması (otomatik profile oluşturma)

- **Tag Model**
  - Tag oluşturma ve `tag_id` otomatik atama
  - Wikidata entegrasyonu
  - Custom tag oluşturma

- **Post Model**
  - Post oluşturma (offer/need)
  - Tag ilişkileri
  - Location ve koordinat validasyonları
  - Hidden post mantığı

- **Proposal Model**
  - Proposal oluşturma ve status yönetimi
  - Time balance işlemleri (offer/need senaryoları)
  - Job oluşturma mantığı
  - Balance validasyonları (yetersiz bakiye kontrolü)
  - Proposal cancellation ve refund mantığı
  - Proposal completion ve balance transfer

- **Review Model**
  - Review oluşturma ve rating validasyonları (1-5)
  - Unique constraint (bir proposal için bir review)
  - Review averages hesaplama

- **Chat & Message Models**
  - Chat oluşturma ve unique constraint
  - Message oluşturma ve read status
  - Chat participant kontrolü

- **Forum Models**
  - ForumTopic oluşturma
  - ForumComment oluşturma
  - Hidden content mantığı

#### 2.1.2 Serializer Tests
- **RegisterSerializer**
  - Password validation
  - Email uniqueness
  - Username uniqueness
  - Interested tags işleme

- **UserSerializer**
  - Profile data serialization
  - Review averages inclusion

- **PostSerializer**
  - Post creation validation
  - Tag relationships

- **ProposalSerializer**
  - Proposal creation validation
  - Status transitions

#### 2.1.3 Service Tests
- **Wikidata Service**
  - Wikidata search functionality
  - Error handling

### 2.2 Integration Tests

#### 2.2.1 Authentication API Tests
- **Register Endpoint** (`/api/register/`)
  - Başarılı kayıt
  - Geçersiz veri ile kayıt
  - Duplicate username/email
  - CSRF token işleme

- **Login Endpoint** (`/api/login/`)
  - Başarılı giriş
  - Geçersiz kullanıcı adı/şifre
  - Session oluşturma

- **Logout Endpoint** (`/api/logout/`)
  - Başarılı çıkış
  - Session temizleme

- **Session Endpoint** (`/api/session/`)
  - Authenticated user bilgisi
  - Unauthenticated user kontrolü

- **CSRF Token Endpoint** (`/api/csrf/`)
  - CSRF cookie set etme

#### 2.2.2 Post API Tests
- **Post CRUD Operations**
  - Post listeleme (filtreleme, arama, sıralama)
  - Post oluşturma
  - Post güncelleme (sadece owner)
  - Post silme (sadece owner)
  - Post detay görüntüleme
  - Hidden post kontrolü (admin vs normal user)

- **Post Filtering**
  - Post type filtreleme (offer/need)
  - Location filtreleme
  - Tag filtreleme
  - Geographic bounding box filtreleme
  - Search functionality

#### 2.2.3 Tag API Tests
- **Tag CRUD Operations**
  - Tag listeleme
  - Tag oluşturma
  - Tag güncelleme
  - Tag silme

- **Tag Search** (`/api/tags/search/`)
  - Local tag search
  - Wikidata search integration
  - Query parameter validation

#### 2.2.4 Profile API Tests
- **User Profile** (`/api/users/<username>/`)
  - Public profile görüntüleme
  - Review data inclusion
  - Non-existent user handling

- **My Profile** (`/api/users/me/`)
  - Own profile görüntüleme
  - Profile güncelleme
  - Interested tags güncelleme

#### 2.2.5 Comment API Tests
- **Comment CRUD Operations**
  - Comment oluşturma
  - Comment listeleme (post'a göre)
  - Comment güncelleme (sadece owner)
  - Comment silme (sadece owner)
  - Hidden comment kontrolü

- **Comment Actions**
  - Report comment
  - Toggle hide (admin only)

#### 2.2.6 Proposal API Tests
- **Proposal CRUD Operations**
  - Proposal oluşturma
  - Proposal listeleme (sent/received filters)
  - Proposal güncelleme
  - Proposal status transitions
  - Balance validasyonları

- **Proposal Workflow**
  - Proposal acceptance (balance deduction)
  - Proposal cancellation (refund)
  - Proposal completion (balance transfer)
  - Job creation on acceptance

#### 2.2.7 Review API Tests
- **Review CRUD Operations**
  - Review oluşturma (proposal completion sonrası)
  - Review listeleme
  - Review filtreleme (proposal, reviewed_user, reviewer)
  - Unique constraint (bir proposal için bir review)

#### 2.2.8 Chat API Tests
- **Chat Operations**
  - Chat listeleme
  - Chat oluşturma/get etme
  - Message gönderme
  - Message listeleme
  - Unread message count
  - Message read status update

#### 2.2.9 Forum API Tests
- **Forum Topic CRUD**
  - Topic oluşturma
  - Topic listeleme
  - Topic detay görüntüleme
  - Topic güncelleme
  - Topic silme
  - Hidden topic kontrolü

- **Forum Comment CRUD**
  - Comment oluşturma
  - Comment listeleme (topic'e göre)
  - Comment güncelleme
  - Comment silme

#### 2.2.10 Admin Dashboard API Tests
- **Admin Dashboard** (`/api/admin-dashboard/`)
  - Admin access control
  - Metrics calculation
  - Transaction listing
  - Post/Forum topic listing
  - Reported comments listing

## 3. Frontend Tests (React)

### 3.1 Unit Tests

#### 3.1.1 Component Tests
- **Header Component**
  - Navigation rendering
  - User menu (authenticated/unauthenticated)
  - Logout functionality
  - Responsive behavior

- **Footer Component**
  - Footer content rendering
  - Link functionality

- **TagSelector Component**
  - Tag selection
  - Tag search
  - Tag creation

- **UI Components** (Button, Input, Card, etc.)
  - Rendering
  - Props handling
  - Event handlers

#### 3.1.2 Page Tests
- **Welcome Page**
  - Rendering
  - Navigation to login/signup

- **Login Page**
  - Form rendering
  - Form validation
  - Error handling
  - Success navigation

- **Signup Page**
  - Form rendering
  - Form validation
  - Password matching
  - Error handling

- **Home Page**
  - Post list rendering
  - Filtering functionality
  - Search functionality
  - Map integration

- **Post Page**
  - Post creation form
  - Post editing form
  - Form validation
  - Image upload

- **PostDetails Page**
  - Post details rendering
  - Comment section
  - Proposal button

- **Profile Pages**
  - Profile data rendering
  - Profile editing
  - Review display

- **Forum Pages**
  - Topic list rendering
  - Topic creation
  - Comment section

- **Chat Page**
  - Chat list rendering
  - Message display
  - Message sending

- **Admin Dashboard**
  - Metrics display
  - Charts rendering
  - Data tables

#### 3.1.3 Utility Tests
- **API Utility** (`api.js`)
  - Axios configuration
  - CSRF token handling
  - Error handling
  - Request interceptors

- **Utils** (`lib/utils.js`)
  - Utility functions

### 3.2 Integration Tests

#### 3.2.1 API Integration Tests
- **Authentication Flow**
  - Register → Login → Session check
  - Logout flow
  - Session persistence

- **Post Operations**
  - Create post → List posts → View details
  - Edit post → Update post
  - Delete post

- **Proposal Workflow**
  - Create proposal → View proposal → Accept/Decline
  - Complete proposal → Create review

- **Chat Flow**
  - Create chat → Send message → Receive message
  - Unread count update

#### 3.2.2 Routing Tests
- **Route Protection**
  - Protected routes (require authentication)
  - Admin routes (require staff)
  - Public only routes
  - Welcome route (redirect if authenticated)

- **Navigation**
  - Route transitions
  - Back navigation
  - Deep linking

### 3.3 UI Tests

#### 3.3.1 User Interaction Tests
- **Authentication Flow**
  - User registration form submission
  - User login form submission
  - Logout button click
  - Session persistence across page reloads

- **Post Creation Flow**
  - Fill post form
  - Select tags
  - Upload image
  - Submit form
  - Verify post appears in list

- **Proposal Flow**
  - View post details
  - Create proposal
  - Accept proposal
  - Complete proposal
  - Create review

- **Chat Flow**
  - Open chat
  - Send message
  - Receive message
  - Mark as read

- **Forum Flow**
  - Create forum topic
  - Add comment
  - View topic details

#### 3.3.2 Form Validation Tests
- **Login Form**
  - Empty fields validation
  - Invalid credentials error

- **Signup Form**
  - Password mismatch
  - Email format validation
  - Username uniqueness

- **Post Form**
  - Required fields validation
  - Tag selection
  - Location validation

#### 3.3.3 Error Handling Tests
- **API Error Handling**
  - Network errors
  - 400/401/403/404 errors
  - Error message display

- **Form Error Display**
  - Validation errors
  - Server errors
  - Success messages

## 4. Test Coverage Goals

### Backend
- **Models**: %90+ coverage
- **Views/API**: %85+ coverage
- **Serializers**: %80+ coverage
- **Services**: %90+ coverage

### Frontend
- **Components**: %80+ coverage
- **Pages**: %75+ coverage
- **Utilities**: %90+ coverage
- **API Integration**: %70+ coverage

## 5. Test Execution

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Coverage Reports
- Backend: `coverage run manage.py test && coverage report`
- Frontend: `npm test -- --coverage`

## 6. Continuous Integration

Tests should be run:
- Before each commit (pre-commit hooks)
- On pull requests
- Before deployment
- In CI/CD pipeline

## 7. Test Data Management

- Use factories/fixtures for test data
- Clean up test data after each test
- Use database transactions for isolation
- Mock external services (Wikidata API)

## 8. Performance Tests (Future)

- API response time tests
- Database query optimization tests
- Frontend rendering performance tests


