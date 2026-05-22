# Tennis Booking — Q&A สำหรับนำเสนอ Project

---

## 1. Architecture / Design Decision

**Q: ทำไมถึงใช้ Session เก็บ `booking_data`?**

เพราะ flow การจองแบ่งเป็นหลาย step (details → payment → store) ข้อมูลที่ user กรอกในหน้า details ต้องถูกส่งต่อไปยังหน้า payment และ store โดยไม่ให้ user แก้ไขได้ระหว่างทาง
ถ้าส่งผ่าน form ทุก step ข้อมูลอย่าง `total_price` หรือ `booking_no` จะถูก user แก้ไขใน browser devtools ได้ การเก็บใน server-side session จึงปลอดภัยกว่า

---

**Q: ทำไมถึงมีทั้ง `bookings` และ `booking_slots` table?**

`bookings` เก็บข้อมูล booking ภาพรวม (ชื่อ, เวลา, ราคา, สถานะ)
`booking_slots` เก็บแต่ละ slot ย่อย (ทีละชั่วโมง) พร้อม unique constraint บน `(court_id, booking_date, slot_start)`
ทำให้ถ้ามี 2 คนจองช่วงเวลาเดียวกันพร้อมกัน database จะ reject คนที่สองโดยอัตโนมัติด้วย `ER_DUP_ENTRY` — เป็นการป้องกัน race condition ระดับ database ซึ่งเชื่อถือได้มากกว่า application-level check อย่างเดียว

---

## 2. Security / Race Condition

**Q: ถ้ามีคน 2 คน กด Confirm พร้อมกัน จะเกิดอะไร?**

มีการป้องกัน 2 ชั้น:
- **ชั้นที่ 1** — ก่อน insert จะ query `booking_slots` ที่ไม่ใช่ status `cancelled` มาเช็คก่อน (ใน `store` และ `paymentInit`)
- **ชั้นที่ 2** — ถ้าผ่านชั้นแรกมาพร้อมกัน (timing attack) database unique constraint จะ throw `ER_DUP_ENTRY` ซึ่งโค้ดจับ error นี้ใน `isDuplicateSlotError()` แล้ว redirect user กลับไปเลือกเวลาใหม่พร้อม flash message

ทั้งหมดอยู่ใน `db.transaction()` เพื่อ rollback ถ้าเกิด error กลางคัน

---

**Q: Payment slip เก็บใน public folder ใครก็เข้าถึงได้ไหม?**

เทคนิคไม่ได้กัน URL โดยตรง แต่ชื่อไฟล์ถูก generate ด้วย `Date.now() + random` ทำให้เดา URL ได้ยากมาก
แต่ถ้าจะทำให้ปลอดภัยกว่านี้ ควรย้าย slip ออกจาก public folder แล้วให้ access ผ่าน controller ที่ตรวจสิทธิ์ก่อน (เช่น admin เท่านั้น) แต่เป็น trade-off กับความซับซ้อนที่เพิ่มขึ้น สำหรับ scope ของ project นี้จึงยังรับได้

---

**Q: ถ้า user เปิด 2 tabs `booking_no` จะชนกันไหม?**

มีโอกาสชนได้ เพราะ `booking_no` = `date + random 4 chars` (36^4 = ~1.6 ล้าน combinations)
ถ้าชน `booking_no` มี unique constraint ใน bookings table จะ throw error ซึ่งปัจจุบันจะ rethrow ขึ้นไปเป็น 500
วิธีแก้ที่ดีกว่าคือ generate `booking_no` ตอน `store` แทน แล้วใช้ retry loop หรือใช้ UUID แทน random string

---

## 3. Business Logic

**Q: ทำไม `MAX_SLOTS = 3`?**

กำหนดให้ user จองได้สูงสุด 3 ชั่วโมงต่อครั้ง เพื่อให้คนอื่นมีโอกาสจองได้บ้าง และป้องกันการ block court ทั้งวัน เป็น business rule ของสนาม ถ้าต้องการเปลี่ยนในอนาคตก็แค่แก้ค่า constant ตัวนี้ได้เลย

---

**Q: ความแตกต่างระหว่าง `guest` กับ `member`?**

- `member` = user ที่ login อยู่ ระบบจะเชื่อม `user_id` ไว้กับ booking ทำให้ดู "My Bookings" ได้
- `guest` = คนที่ไม่ได้ login `user_id` จะเป็น `null` แต่ยังจองได้ปกติ ตรวจสอบสถานะการจองได้ผ่าน booking_no + email/โทรศัพท์ใน `/check-booking`

---

**Q: ถ้า admin cancel booking แล้ว slot จะกลับมาได้ไหม?**

ได้ทันที เพราะ `getBookedSlots()` query ใช้ `.whereNot('status', 'cancelled')` หมายความว่า slot ของ booking ที่ถูก cancel จะไม่ถูกนับว่าจองแล้ว user คนอื่นสามารถจองช่วงเวลานั้นได้เลย

---

## 4. Missing Features / Trade-offs

**Q: `discount` column มีแต่ไม่ได้ใช้?**

เตรียม column ไว้สำหรับ feature ส่วนลดในอนาคต เช่น ส่วนลด member หรือ promotion แต่ใน scope ของ project นี้ยังไม่ได้ implement logic ส่วนนั้น

---

**Q: ไม่มี email notification เพราะอะไร?**

เป็น feature ที่ต้อง integrate กับ email service ภายนอก (เช่น SMTP, SendGrid) ซึ่งเกินขอบเขตของ project นี้ ถ้าจะทำต่อ AdonisJS มี mail module ให้ใช้ได้ตรงๆ และควร send เมื่อสถานะเปลี่ยนเป็น `confirmed` หรือ `cancelled`

---

**Q: Booking `pending` นาน ไม่มี auto-expire?**

ปัจจุบันไม่มี ถ้า booking `pending` อยู่นานๆ slot ก็จะถูก block ไปเรื่อยๆ
วิธีแก้คือทำ scheduled job (cron) ที่รัน ตรวจ booking ที่ `pending` เกิน X ชั่วโมง แล้ว auto-cancel และลบ slot ออก แต่ต้องระวังเรื่อง user ที่ upload slip แล้วแต่ admin ยังไม่ได้ confirm

---

## 5. Technical Deep Dive

**Q: อธิบาย flow การจองตั้งแต่ต้นจนจบ**

1. `/booking` — เลือก court และวันที่
2. `/api/available-slots` — AJAX ดึง slot ที่ถูกจองแล้ว
3. `/booking/details` — กรอกข้อมูลส่วนตัว, เห็นราคา
4. `POST /booking/payment-init` — validate ข้อมูล, เช็ค slot ซ้ำ, เก็บลง session
5. `/booking/payment` — แสดงหน้าอัปโหลด slip
6. `POST /booking/store` — รับ slip, เช็ค slot อีกรอบ, insert booking + slots ใน transaction
7. `/booking/success/:bookingNo` — แสดงผลสำเร็จ

Admin จะ confirm/cancel booking ผ่าน `/admin/bookings`

---

**Q: ถ้า scale ถึง 1,000 concurrent users ส่วนไหนเป็น bottleneck?**

จุดที่น่าเป็นห่วงที่สุดคือการเช็ค + insert slot เพราะต้อง query แล้ว insert เป็น 2 operations แยกกัน แม้มี unique constraint รองรับแล้ว แต่ยังมี overhead จากการ rollback และ retry
แนวทางปรับคือใช้ `SELECT FOR UPDATE` (pessimistic locking) ใน transaction เพื่อ lock row ระหว่างเช็ค หรือ queue การจองด้วย Redis เพื่อให้จัดการทีละ request
