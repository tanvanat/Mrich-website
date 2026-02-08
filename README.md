## 1. Project Overview

MRICH is a secure web platform that allows users to:

- Sign in using **Google OAuth**
- Access **protected pages**
- Learn about **organization goals**
- Complete a **leadership assessment form**
- Receive **personalized results**
- Experience an interactive UI (video background + draggable cards)

The project focuses on:
- Security
- Clean architecture
- Real deployment workflow
- Recruiter-friendly structure

---

## 2. Tech Stack

**Frontend**
- Next.js 16 (App Router)
- React
- Tailwind CSS
- Framer Motion

**Backend**
- NextAuth (OAuth)
- Prisma ORM
- PostgreSQL

**Auth**
- Google OAuth 2.0
- Session-based authentication

**Deployment**
- Vercel

---

## 3. Install dependencies
npm install next-auth prisma @prisma/client \
@auth/prisma-adapter pg \
tailwindcss framer-motion zod

## 4. Tailwind CSS Setup
npx tailwindcss init -p

## 5. Database Setup (PostgreSQL + Prisma)
npx prisma init

prisma/schema.prisma

npx prisma migrate dev
npx prisma generate

## 6. env
## 7. Google OAuth Setup

