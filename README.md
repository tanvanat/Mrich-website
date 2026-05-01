# MRICH Assessment Platform

Next.js full-stack web application สำหรับระบบการเรียนรู้และประเมินผลของ Multi Rich Academy พร้อม role-based access control, exam workflow, และ admin scoring dashboard

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **Auth:** Cookie-based nickname + password (bcrypt)
- **Styling:** Tailwind CSS + Framer Motion
- **Deploy:** Vercel 

---

- Vercel เป็นแพลตฟอร์มสำหรับ deploy web application แบบ serverless ที่ช่วยจัดการทุกอย่างให้ตั้งแต่การสร้าง VM หรือ container ติดตั้ง runtime เช่น Node.js ไปจนถึงการ build และ deploy โค้ดอัตโนมัติ พร้อมทั้งมีระบบ auto scaling และ CDN

- Neon เป็นฐานข้อมูล PostgreSQL แบบ serverless ที่สามารถปรับขนาดอัตโนมัติ แยกการทำงานระหว่าง compute และ storage เพื่อเพิ่มประสิทธิภาพ และยังสามารถสร้าง branch ของฐานข้อมูลได้คล้ายการใช้ Git

- ซ่อนDocker หรือ VM ไว้เบื้องหลัง

## โครงสร้าง Folder

```
mrich-assessment/
├── prisma/                   # Database schema & migrations
├── src/
│   ├── app/                  # Next.js App Router pages & API routes
│   │   ├── (pages)/          # หน้าต่างๆ
│   │   └── api/              # Backend API endpoints
│   └── lib/                  # Shared utilities & business logic
├── middleware.ts              # Route protection
├── .env                      # Environment variables (roles, passwords, DB)
└── next.config.ts
```

---

## อธิบายแต่ละ Folder

### `prisma/`
จัดการ database schema และ migration history

| ไฟล์ | หน้าที่ |
|------|---------|
| `schema.prisma` | กำหนดโครงสร้าง database — models: `User`, `Account`, `Session`, `Response`, `ExamState`, `VerificationToken` |
| `migrations/` | ประวัติการเปลี่ยนแปลง schema ตามลำดับเวลา เช่น เพิ่ม password field, เพิ่ม ExamState, เพิ่ม expiresAt |

---

### `src/lib/`
Logic กลางที่ใช้ร่วมกันทั่วทั้ง app

| ไฟล์ | หน้าที่ |
|------|---------|
| `auth.ts` | ฟังก์ชัน auth หลัก: `normalizeNick()`, `getNickFromCookie()`, `getAdminNames()`, `isNickAdmin()`, `getOrCreateUserByNick()` |
| `auth-options.ts` | NextAuth config (Google OAuth + Prisma adapter) สำหรับ session management |
| `access.ts` | **ไฟล์ควบคุม role** — อ่านจาก env `ADMIN_NAMES`, `LEADER_NAMES`, `LEARNER_NAMES` แล้ว return `AccessInfo` ที่มี role และ permission flags |
| `prisma.ts` | Prisma client singleton สำหรับ connect database |
| `questions-course1.ts` | ชุดคำถาม, scoring logic, และ `levelFromPercent()` สำหรับ Course 1 (Mindset & Principles) |
| `questions-course2.ts` | ชุดคำถาม, scoring logic สำหรับ Course 2 (Proactive) |

---

### `src/app/` (Pages)

| Folder/File | Route | หน้าที่ |
|------------|-------|---------|
| `page.tsx` | `/` | หน้า Landing page — แสดง Casper character + ปุ่มเข้าสู่ระบบ |
| `signin/` | `/signin` | หน้า Login — กรอก nickname + password |
| `signup/` | `/signup` | หน้า Register — ตั้ง password 6 ตัวครั้งแรก |
| `home/` | `/home` | หน้าหลักหลัง login — แสดง course cards ตาม role (LEARNER เห็น Course 1, LEADER เห็นทั้งคู่) |
| `form/` | `/form?course=...` | หน้าทำแบบทดสอบ — แสดงคำถาม, จับเวลา 30 นาที, submit คำตอบ |
| `goal/` | `/goal` | หน้าแสดงผลคะแนนหลัง submit |
| `blocked/` | `/blocked` | หน้าแสดงเมื่อ user ถูก lock (ทำข้อสอบแล้ว รอ admin unlock) |
| `admin/` | `/admin` | หน้า admin dashboard — ดูผลประเมินทั้งหมด + export CSV |
| `admin/exam/` | `/admin/exam` | หน้า admin ให้คะแนน — เห็นคำตอบของแต่ละ user, ให้คะแนน, unlock |
| `forgot-email/` | `/forgot-email` | หน้าช่วยเหลือสำหรับลืม email |

---

### `src/app/api/` (API Routes)

#### Auth APIs
| Route | Method | หน้าที่ |
|-------|--------|---------|
| `/api/auth/signin` | POST | Login ด้วย nickname + password, set cookie `mrich_nick` |
| `/api/auth/signup` | POST | Register — hash password แล้ว upsert user ใน DB |
| `/api/auth/nick` | POST | Login endpoint หลัก (เวอร์ชันใหม่) |
| `/api/auth/me` | GET | ดึงข้อมูล user ปัจจุบัน + role + permissions |
| `/api/auth/[...nextauth]` | ANY | NextAuth handler (Google OAuth) |

#### Exam APIs
| Route | Method | หน้าที่ |
|-------|--------|---------|
| `/api/exam/state` | GET/POST | ดึง/สร้าง ExamState — ตรวจว่า locked หรือยัง, สร้าง attemptToken |
| `/api/exam/submit` | POST | รับคำตอบ, score อัตโนมัติ (ถ้ามี), save Response, lock ExamState |
| `/api/exam/reset` | POST | Reset ExamState (admin only) |

#### Admin APIs
| Route | Method | หน้าที่ |
|-------|--------|---------|
| `/api/admin/responses` | GET | ดึง response ทั้งหมด (ต้องเป็น admin) |
| `/api/admin/score` | POST | Admin ให้คะแนน manual แต่ละคำถาม |
| `/api/admin/unlock` | POST | Unlock user ให้ทำข้อสอบใหม่ได้ |
| `/api/admin/attempts` | GET | ดึงข้อมูล exam attempts |
| `/api/admin/exam-states` | GET | ดึง exam state ทั้งหมด |
| `/api/admin/export` | GET | Export ผลเป็น CSV |

#### User APIs
| Route | Method | หน้าที่ |
|-------|--------|---------|
| `/api/user/score` | GET | ดึงคะแนนของ user ปัจจุบัน |
| `/api/user/locked-courses` | GET | ดึงรายการ course ที่ถูก lock |
| `/api/responses` | GET | ดึง responses ของ user |

---

### `middleware.ts`
Route guard ระดับ edge — ทำงานก่อน request ถึง page

- Route สาธารณะ: `/`, `/signin`, `/api/auth/nick`, `/_next`
- Route protected: `/home`, `/form`, `/goal`, `/admin` → ต้องมี cookie `mrich_nick`
- Route admin-only: `/admin` → ต้องเป็นชื่อที่อยู่ใน `ADMIN_NAMES`

---

### `.env`
ไฟล์ config ที่ **สำคัญที่สุด** — กำหนด role ของทุก user ผ่าน environment variables

```env
ADMIN_NAMES=front,mrich,admin141
LEADER_NAMES=friend,noey,bukae,leader141
LEARNER_NAMES=lek,game,min,jar,tee,por,nan,nun,tong,test141
```

Logic ที่อ่านค่าเหล่านี้อยู่ใน `src/lib/access.ts` และ `src/lib/auth.ts`

---

## ระบบ Role

Role ทั้งหมดกำหนดผ่าน `.env` ไม่ได้เก็บใน database โดยตรง (DB เก็บแค่ `USER` / `ADMIN`)

| Role | Env Variable | สิทธิ์ |
|------|-------------|--------|
| **ADMIN** | `ADMIN_NAMES` | เข้า `/admin`, ให้คะแนน, unlock user, ดูทุก course |
| **LEADER** | `LEADER_NAMES` | ทำได้ทั้ง Course 1 และ Course 2 |
| **LEARNER** | `LEARNER_NAMES` | ทำได้เฉพาะ Course 1 |

---

## Exam Workflow

```
User login → /home (เห็น course ตาม role)
    → กด Start → สร้าง ExamState (attemptToken, startedAt, expiresAt)
    → ทำข้อสอบ 35 นาที (/form)
    → Submit → บันทึก Response, Lock ExamState
    → /goal (ดูคะแนน)
    → ถ้าอยากทำใหม่ → Admin ต้อง Unlock ก่อน
```

## การ Run โปรเจค

```bash
# ติดตั้ง dependencies
npm install

# Setup database
npx prisma migrate dev

# Run development server
npm run dev
```