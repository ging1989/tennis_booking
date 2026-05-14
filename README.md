# Tennis Booking

เว็บจองสนามเทนนิส พัฒนาโดยใช้ AdonisJS, Edge template, MySQL และ Semantic UI

เอกสารนี้เขียนไว้สำหรับคนที่มารับงานต่อ ให้เข้าใจโครงสร้างโปรเจกต์และ flow หลักโดยไม่ต้องไล่อ่านทุกไฟล์ตั้งแต่ต้น

## Tech Stack

- Backend: AdonisJS 6
- Template: Edge
- Database: MySQL
- ORM: Lucid
- Validator: VineJS
- Frontend style: CSS ใน `resources/css/app.css` และ Semantic UI ใน `public/Semantic`

## คำสั่งที่ใช้บ่อย

```bash
npm install
npm run dev
npm run typecheck
npm run lint
```

คำสั่ง database ของ AdonisJS:

```bash
node ace migration:run
node ace db:seed
```

ถ้าเพิ่ง clone โปรเจกต์ ให้คัดลอก `.env.example` เป็น `.env` แล้วตั้งค่า database ให้ตรงกับเครื่องตัวเองก่อนรัน migration

## โครงสร้างไฟล์สำคัญ

- `start/routes.ts` รวม route ทั้งหมดของเว็บ
- `app/controllers/auth_controller.ts` จัดการสมัครสมาชิก, login, logout
- `app/controllers/home_controller.ts` แสดงหน้าหลักและตารางสนามว่างของวันนี้
- `app/controllers/bookings_controller.ts` จัดการ flow การจอง, payment slip, และค้นหาสถานะการจอง
- `app/models/user.ts` model ผู้ใช้
- `app/models/court.ts` model สนาม
- `app/models/booking.ts` model การจอง
- `app/validators/register_validator.ts` validate ฟอร์มสมัครสมาชิก
- `app/validators/booking_validator.ts` validate ข้อมูลก่อนเริ่ม payment
- `resources/views/pages/*.edge` ไฟล์หน้าเว็บ
- `resources/css/app.css` style หลักของเว็บ
- `database/migrations` โครงสร้างตาราง
- `database/seeders` ข้อมูลตั้งต้น เช่น สนามเทนนิส

## Flow หลักของระบบ

### สมัครสมาชิกและเข้าสู่ระบบ

ไฟล์หลักคือ `app/controllers/auth_controller.ts`

1. `showRegister()` แสดงหน้าสมัครสมาชิก
2. `register()` validate ข้อมูลด้วย `registerValidator`
3. เช็ก email ซ้ำด้วย `User.findBy('email', data.email)`
4. hash password ก่อนบันทึก user
5. `showLogin()` แสดงหน้า login
6. `login()` เช็ก email และ password
7. ถ้าถูกต้อง จะเก็บข้อมูล user ที่จำเป็นลง session key ชื่อ `user`
8. `logout()` ลบ session user ออก

ใน controller มี helper เล็ก ๆ เพื่อให้อ่านง่าย:

- `flashError()` ใช้แสดง error message ซ้ำ ๆ
- `getUserSession()` เลือก field ของ user ที่จะเก็บลง session
- `USER_SESSION_KEY` เก็บชื่อ key ของ session ไว้ที่เดียว

### หน้าหลัก

ไฟล์หลักคือ `app/controllers/home_controller.ts` และ `resources/views/pages/home.edge`

หน้าหลักโหลดข้อมูลสนามทั้งหมด แล้วสร้าง `courtSlots` สำหรับแสดงเวลาว่างตั้งแต่ `07:00` ถึง `22:00`

เงื่อนไขสำคัญ:

- ถ้าเวลานั้นผ่านไปแล้ว จะเป็น slot แบบ `past`
- ถ้าสนามมี status เป็น `available` และเวลายังไม่ผ่าน จะเป็น slot แบบ `available`
- ถ้าสนามไม่ว่าง จะเป็น slot แบบ `unavailable`

### จองสนาม

ไฟล์หลักคือ `app/controllers/bookings_controller.ts`

flow แบบย่อ:

1. `index()` แสดงหน้าจองสนาม
2. `availableSlots()` ส่งรายการ slot ที่ถูกจองแล้วให้ frontend
3. `details()` ตรวจ court, date, slots แล้วแสดงหน้ารายละเอียดการจอง
4. `paymentInit()` validate form และเก็บ `booking_data` ลง session
5. `payment()` แสดงหน้าแนบสลิป
6. `store()` ตรวจสลิป, เช็ก slot ซ้ำอีกครั้ง, แล้วบันทึก booking กับ booking slots ใน transaction

ข้อควรระวัง:

- ระบบจำกัดการจองไม่เกิน `MAX_SLOTS = 3`
- slot ต้องต่อกัน เช่น `09:00,10:00,11:00`
- ก่อนบันทึกจริงมีการเช็ก duplicate slot อีกครั้ง เพื่อกันคนจองเวลาชนกัน
- ถ้าบันทึก booking ไม่สำเร็จหลัง upload slip แล้ว ระบบจะลบไฟล์ slip ที่ upload ไปแล้ว

### ตรวจสอบสถานะการจอง

ไฟล์หลักคือ `resources/views/pages/check_booking.edge` และท้ายไฟล์ `app/controllers/bookings_controller.ts`

1. `checkBooking()` เปิดหน้าค้นหา และส่ง `searched: false`
2. `searchBooking()` รับ `booking_no` กับ `contact`
3. ค้นหาด้วย booking number และ email หรือเบอร์โทรศัพท์
4. ส่ง `searched: true` เพื่อให้ view รู้ว่าผู้ใช้กดค้นหาแล้ว

## Database โดยย่อ

ตารางหลัก:

- `users` เก็บข้อมูลสมาชิก
- `courts` เก็บข้อมูลสนาม
- `bookings` เก็บข้อมูลการจอง
- `booking_slots` เก็บ slot รายชั่วโมง เพื่อช่วยกันเวลาจองซ้ำ

Seeder ที่มี:

- `database/seeders/court_seeder.ts` สร้าง Court 1 ถึง Court 6 ราคา 250 บาทต่อชั่วโมง
- `database/seeders/user_seeder.ts` สร้าง user ตั้งต้น ถ้ามีการเรียก seed

## การตรวจงานก่อนส่งต่อ

ก่อน commit หรือส่งงานต่อ ควรรัน:

```bash
npm run typecheck
npm run lint
```

ถ้าแก้หน้าเว็บหรือ CSS ควรเปิดเว็บด้วย:

```bash
npm run dev
```

แล้วลอง flow เหล่านี้:

- สมัครสมาชิกใหม่
- login และ logout
- เลือกสนามและเวลา
- แนบสลิปเพื่อสร้าง booking
- ค้นหา booking ด้วย Booking No. และ email หรือเบอร์โทรศัพท์

## Notes สำหรับคนทำต่อ

- ชื่อ field ใน form หลายจุดใช้ snake_case เช่น `full_name`, `booking_date` แต่ model ของ Lucid ใช้ camelCase เช่น `fullName`, `bookingDate`
- ถ้าเพิ่ม field ใหม่ ต้องเช็กพร้อมกันทั้ง view, validator, controller, model และ migration
- `session.get('user')` ถูก share ให้ view ผ่าน `app/middleware/shared_auth_middleware.ts`
- ไฟล์ payment slip ถูกเก็บใน `public/uploads/slips`
- ถ้าแก้ logic เวลา ให้ดู helper ใน `bookings_controller.ts` เช่น `parseSlots()`, `slotsAreReady()`, `getBookedSlots()`
