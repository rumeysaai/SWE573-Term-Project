# PowerShell Execution Policy Hatası Çözümü

Windows'ta PowerShell scriptlerini çalıştırmak için execution policy ayarlamanız gerekebilir.

## 🔧 Çözüm 1: Batch Dosyası Kullanın (Önerilen)

En kolay çözüm, PowerShell yerine batch dosyasını kullanmaktır:

```cmd
set DOCKER_USERNAME=your-username
scripts\publish.bat 1.0.0
```

## 🔧 Çözüm 2: Execution Policy'yi Değiştirin

### Yöntem A: Sadece Mevcut Kullanıcı İçin (Önerilen)

PowerShell'i **Yönetici olarak** açın ve şu komutu çalıştırın:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Bu komut:
- Sadece sizin kullanıcı hesabınızı etkiler
- İnternet'ten indirilen scriptler için dijital imza gerektirir
- Yerel scriptlerinizi çalıştırmanıza izin verir

### Yöntem B: Geçici Olarak Bypass

Script'i çalıştırırken execution policy'yi bypass edin:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish.ps1 -Version 1.0.0
```

### Yöntem C: Sadece Bu Script İçin

```powershell
powershell -ExecutionPolicy RemoteSigned -File .\scripts\publish.ps1 -Version 1.0.0
```

## 🔍 Mevcut Policy'yi Kontrol Etme

```powershell
Get-ExecutionPolicy -List
```

## 📋 Execution Policy Seçenekleri

- **Restricted**: Hiçbir script çalıştırılamaz (varsayılan)
- **RemoteSigned**: İnternet'ten indirilen scriptler imzalı olmalı, yerel scriptler çalışabilir
- **Unrestricted**: Tüm scriptler çalışabilir (güvenlik riski)
- **Bypass**: Tüm kontrolleri atla (sadece geçici kullanım için)

## ✅ Önerilen Yaklaşım

1. **Batch dosyasını kullanın** (`publish.bat`) - En kolay ve güvenli
2. Eğer PowerShell kullanmak istiyorsanız, **RemoteSigned** policy'sini kullanın
3. Production ortamlarında **asla Unrestricted veya Bypass kullanmayın**

## 🚀 Hızlı Başlangıç

```cmd
REM Batch dosyası ile (Önerilen)
set DOCKER_USERNAME=your-username
scripts\publish.bat 1.0.0
```

VEYA

```powershell
# PowerShell ile (Execution policy ayarlandıktan sonra)
$env:DOCKER_USERNAME="your-username"
.\scripts\publish.ps1 -Version 1.0.0
```

