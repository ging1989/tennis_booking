# Tennis Booking

ระบบจองสนามเทนนิสออนไลน์ พัฒนาด้วย AdonisJS v6 + TypeScript

## Tech Stack

- **Framework:** [AdonisJS v6](https://adonisjs.com/)
- **Language:** TypeScript
- **Database:** MySQL (via Lucid ORM)
- **Template Engine:** Edge.js
- **Frontend Build:** Vite
- **CSS:** Semantic UI
- **Auth:** AdonisJS Auth (session-based)

## Features

- สมัครสมาชิก / เข้าสู่ระบบ
- ดูรายการสนามเทนนิสที่เปิดให้บริการ
- จองสนามตามวันและช่วงเวลาที่ต้องการ
- อัปโหลดสลิปการชำระเงิน
- ตรวจสอบสถานะการจอง
- ดูประวัติการจองของตัวเอง
- **Admin Panel:** จัดการการจอง (ยืนยัน / ยกเลิก) และจัดการสนาม

## Getting Started

### Prerequisites

- Node.js >= 20
- MySQL

### Installation

1. Clone the repo และติดตั้ง dependencies

```bash
git clone <repo-url>
cd tennis_booking
npm install
```

2. คัดลอกไฟล์ environment

```bash
cp .env.example .env
```

3. ตั้งค่า `.env`

```env
APP_KEY=        # สร้างด้วย: node ace generate:key
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=app
```

4. รัน migration และ seed ข้อมูล

```bash
node ace migration:run
node ace db:seed
```

5. เริ่ม development server

```bash
npm run dev
```

เปิดที่ `http://localhost:3333`

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | TypeScript type check |
| `npm test` | Run tests |

## Project Structure

```
app/
├── controllers/      # Route handlers
├── middleware/       # Auth, admin guards
├── models/           # Booking, Court, User
└── validators/       # Input validation

database/
├── migrations/       # DB schema
└── seeders/          # Seed data

resources/
├── css/              # Global styles
└── js/               # Frontend scripts (Vite)

start/
├── routes.ts         # Route definitions
└── kernel.ts         # Middleware stack
```

## Routes

### Public
| Method | Path | Description |
|---|---|---|
| GET | `/` | หน้าแรก |
| GET | `/court` | รายการสนาม |
| GET | `/login` | หน้า Login |
| GET | `/register` | หน้าสมัครสมาชิก |
| GET | `/check-booking` | ตรวจสอบสถานะการจอง |

### User (ต้อง Login)
| Method | Path | Description |
|---|---|---|
| GET | `/booking` | หน้าจองสนาม |
| POST | `/booking/store` | บันทึกการจอง |
| GET | `/booking/payment` | หน้าชำระเงิน |
| GET | `/booking/success/:bookingNo` | ยืนยันการจองสำเร็จ |
| GET | `/my-bookings` | ประวัติการจองของฉัน |

### Admin
| Method | Path | Description |
|---|---|---|
| GET | `/admin/bookings` | จัดการการจองทั้งหมด |
| GET | `/admin/courts` | จัดการสนาม |
| POST | `/admin/bookings/:id/confirm` | ยืนยันการจอง |
| POST | `/admin/bookings/:id/cancel` | ยกเลิกการจอง |

## Database Schema

**users** — ข้อมูลผู้ใช้ (role: `user` / `admin`)

**courts** — สนามเทนนิส (ชื่อสนาม, ราคาต่อชั่วโมง, สถานะ)

**bookings** — การจอง (รองรับทั้ง guest และ member)
