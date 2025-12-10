# MangaRec - ระบบแนะนำมังงะและนิยาย

ระบบแนะนำหนังสือมังงะและนิยายอัจฉริยะ พัฒนาด้วย **Python Backend** + **React Frontend** + **Google Sheets** + **Supabase Auth**

---

## 📋 สารบัญ
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [การติดตั้ง](#-การติดตั้ง)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [การแก้ไขปัญหา](#-การแก้ไขปัญหา-troubleshooting)

---

## 🌟 Features

- 🔐 **Authentication** - เข้าสู่ระบบด้วย Email (Supabase Auth)
- 🔍 **Search** - ค้นหาแบบ Full-text รองรับภาษาไทย
- 📖 **Book Details** - ดูรายละเอียดหนังสือ, รีวิว และหนังสือที่คล้ายกัน
- ❤️ **Favorites** - บันทึกหนังสือที่ชอบ
- ⭐ **Reviews** - เขียนรีวิวและให้คะแนน
- 🎯 **Recommendations** - รับคำแนะนำหนังสือจาก AI

---

## 🛠️ Tech Stack

### Backend
- **Flask** - Web Framework
- **Google Sheets API** - Data Storage
- **Supabase** - Authentication (JWT)
- **scikit-learn** - Recommendation Engine
- **pandas/numpy** - Data Processing

### Frontend
- **React 18** - UI Library
- **React Router** - Navigation
- **TailwindCSS** - Styling
- **Supabase JS** - Authentication
- **Axios** - HTTP Client

---

## 🚀 การติดตั้ง

### Prerequisites (สิ่งที่ต้องติดตั้งก่อน)

#### 1. Python 3.9+
- ดาวน์โหลด: https://www.python.org/downloads/
- ✅ ตอนติดตั้ง **เลือก "Add Python to PATH"**
- ตรวจสอบ:
```bash
python --version
```
**✅ ผ่าน:** `Python 3.9.x` หรือสูงกว่า

---

#### 2. Node.js 18+ & npm
- ดาวน์โหลด: https://nodejs.org/ (เลือก LTS version)
- ตรวจสอบ:
```bash
node --version
npm --version
```
**✅ ผ่าน:** `v18.x.x` หรือสูงกว่า และ `9.x.x` หรือสูงกว่า

---

#### 3. Git
- ดาวน์โหลด: https://git-scm.com/downloads
- ตรวจสอบ:
```bash
git --version
```
**✅ ผ่าน:** `git version 2.x.x`

---

#### 4. Supabase Account (ฟรี)
1. ไปที่ https://supabase.com/
2. สมัครสมาชิก / เข้าสู่ระบบ
3. สร้าง Project ใหม่
4. ไปที่ **Settings > API** เพื่อหา:
   - `Project URL` (เช่น `https://xxxxx.supabase.co`)
   - `anon public key` (ใช้ใน frontend)
   - `service_role key` (ใช้ใน backend)

---

#### 5. Google Cloud Project (สำหรับ Google Sheets API)
1. ไปที่ https://console.cloud.google.com/
2. สร้าง Project ใหม่
3. เปิดใช้งาน **Google Sheets API**
4. สร้าง **Service Account** และดาวน์โหลด JSON credentials
5. สร้าง Google Spreadsheet และแชร์ให้ Service Account email

---

## Backend Setup

### 1. เข้าไปที่โฟลเดอร์ backend
```bash
cd backend
```

### 2. สร้าง Virtual Environment
```bash
python -m venv venv
```

**✅ ผ่าน - จะเห็น output:**
```
(ไม่มี output = สำเร็จ)
```
และจะมีโฟลเดอร์ `venv` ถูกสร้างขึ้น

**❌ ไม่ผ่าน - ถ้าเจอ error:**
```
'python' is not recognized as an internal or external command
```
**วิธีแก้:** ติดตั้ง Python จาก https://www.python.org/downloads/ และเลือก "Add Python to PATH"

---

### 3. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**✅ ผ่าน - จะเห็น:**
```
(venv) C:\Users\...\backend>
```
(มี `(venv)` นำหน้า command prompt)

**❌ ไม่ผ่าน - ถ้าเจอ error:**
```
venv\Scripts\activate : cannot be loaded because running scripts is disabled
```
**วิธีแก้:** รันใน PowerShell ในฐานะ Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### 4. ติดตั้ง Dependencies
```bash
pip install -r requirements.txt
```

**✅ ผ่าน - จะเห็น:**
```
Successfully installed flask-3.0.0 flask-cors-4.0.0 ...
```

**❌ ไม่ผ่าน - ถ้าเจอ error:**
```
ERROR: Could not find a version that satisfies the requirement
```
**วิธีแก้:** อัพเดท pip:
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

### 5. สร้างไฟล์ .env
```bash
copy .env.example .env
```
แล้วแก้ไขค่าใน `.env`:
```env
# Server Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# Google Sheets Configuration
GOOGLE_CREDENTIALS_FILE=./credentials.json
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5000
```

---

### 6. รัน Backend Server
```bash
python run.py
```

**✅ ผ่าน - จะเห็น:**
```
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
```

**❌ ไม่ผ่าน - ถ้าเจอ error:**

**Error 1: DLL load failed (scikit-learn)**
```
ImportError: DLL load failed while importing _loss
```
**วิธีแก้:** 
1. เปิด Windows Security > Virus & threat protection > Exclusions
2. เพิ่ม folder: `backend\venv\Lib\site-packages\sklearn`

**Error 2: No module named 'xxx'**
```
ModuleNotFoundError: No module named 'flask'
```
**วิธีแก้:** ตรวจสอบว่า activate venv แล้ว และรัน:
```bash
pip install -r requirements.txt
```

---

## Frontend Setup

### 1. เข้าไปที่โฟลเดอร์ frontend
```bash
cd frontend
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

**✅ ผ่าน - จะเห็น:**
```
added 1500 packages, and audited 1547 packages in 30s
```

**❌ ไม่ผ่าน - ถ้าเจอ error:**
```
npm ERR! code ENOENT
```
**วิธีแก้:** ตรวจสอบว่าอยู่ในโฟลเดอร์ frontend และมีไฟล์ `package.json`

---

### 3. สร้างไฟล์ .env
```bash
copy .env.example .env
```
แล้วแก้ไขค่าใน `.env`:
```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# API URL
REACT_APP_API_URL=http://localhost:5000/api
```

---

### 4. รัน Frontend Server
```bash
npm start
```

**✅ ผ่าน - จะเห็น:**
```
Compiled successfully!

You can now view manga-recommendation-frontend in the browser.

  Local:            http://localhost:3000
```
และ browser จะเปิดอัตโนมัติ

**❌ ไม่ผ่าน - ถ้าเจอ error:**

**Error 1: Module not found**
```
Module not found: Error: Can't resolve 'xxx'
```
**วิธีแก้:** รัน:
```bash
npm install
```

**Error 2: Port already in use**
```
Something is already running on port 3000
```
**วิธีแก้:** กด `Y` เพื่อใช้ port อื่น หรือปิดโปรแกรมที่ใช้ port 3000

---

## 🔧 การแก้ไขปัญหา (Troubleshooting)

### หน้าเว็บว่างเปล่า
1. เปิด Browser DevTools (F12) > Console
2. ดู error message
3. ตรวจสอบว่า backend รันอยู่ที่ `http://localhost:5000`
4. ตรวจสอบ `.env` ว่า `REACT_APP_API_URL` ถูกต้อง

### API Error 401 Unauthorized
- ตรวจสอบ Supabase credentials ใน `.env` ทั้ง frontend และ backend

### CORS Error
- ตรวจสอบว่า `CORS_ORIGINS` ใน backend `.env` มี `http://localhost:3000`

---

## 📱 การใช้งาน

1. เปิด browser ไปที่ `http://localhost:3000`
2. สมัครสมาชิกหรือเข้าสู่ระบบ
3. ค้นหาหนังสือ, ดูรายละเอียด, เพิ่มรายการโปรด
4. รับคำแนะนำหนังสือจากระบบ AI

---

## 📝 License

MIT License - สามารถใช้งานได้อย่างอิสระ
