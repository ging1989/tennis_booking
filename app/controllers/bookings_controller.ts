import type { HttpContext } from '@adonisjs/core/http'
import Court from '#models/court'
import Booking from '#models/booking'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { storeBookingValidator } from '#validators/booking_validator'
import { unlink } from 'node:fs/promises'

const MAX_SLOTS = 3
const BOOKING_START_HOUR = 7
const BOOKING_END_HOUR = 22

function slotToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function normalizeSlot(time: string) {
  return time.substring(0, 5)
}

function nextHour(time: string) {
  const [hours] = time.split(':').map(Number)
  return `${String(hours + 1).padStart(2, '0')}:00`
}

function parseSlots(value: string | undefined) {
  return [
    ...new Set(
      (value ?? '')
        .split(',')
        .map((slot) => slot.trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => slotToMinutes(a) - slotToMinutes(b))
}

function isValidSlot(slot: string) {
  if (!/^\d{2}:00$/.test(slot)) return false

  const [hour] = slot.split(':').map(Number)
  return hour >= BOOKING_START_HOUR && hour <= BOOKING_END_HOUR
}

function isConsecutive(slots: string[]) {
  for (let index = 1; index < slots.length; index++) {
    if (slotToMinutes(slots[index]) - slotToMinutes(slots[index - 1]) !== 60) {
      return false
    }
  }

  return true
}

function expandBookedSlots(bookings: Booking[]) {
  const slots = new Set<string>()

  for (const booking of bookings) {
    let current = normalizeSlot(booking.timeStart)
    const end = normalizeSlot(booking.timeEnd)

    while (slotToMinutes(current) < slotToMinutes(end)) {
      slots.add(current)
      current = nextHour(current)
    }
  }

  return [...slots]
}

function createBookingSlots(timeStart: string, timeEnd: string) {
  return parseSlots(
    Array.from({ length: (slotToMinutes(timeEnd) - slotToMinutes(timeStart)) / 60 }, (_, index) => {
      const hour = Number(timeStart.substring(0, 2)) + index
      return `${String(hour).padStart(2, '0')}:00`
    }).join(',')
  )
}

function isDuplicateSlotError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const dbError = error as { code?: string; errno?: number }
  return dbError.code === 'ER_DUP_ENTRY' || dbError.errno === 1062
}

async function removeUploadedSlip(slipPath: string) {
  await unlink(app.publicPath(slipPath)).catch(() => {})
}

export default class BookingsController {
  async index({ view, request }: HttpContext) {
    const courts = await Court.query().orderBy('court_name', 'asc')
    const courtId = request.input('court')
    const court = courtId ? await Court.find(courtId) : null
    const bookingDate = request.input('date') || new Date().toISOString().split('T')[0]
    return view.render('pages/booking', { courts, court, bookingDate })
  }

  async availableSlots({ request, response }: HttpContext) {
    const date = request.input('date')
    const courtId = request.input('court_id')

    if (!date || !courtId) {
      return response.badRequest({ error: 'date and court id are required' })
    }

    const bookings = await Booking.query()
      .where('booking_date', date)
      .where('court_id', courtId)
      .whereNot('status', 'cancelled')

    const bookedSlots = expandBookedSlots(bookings)

    return response.json({ bookedSlots })
  }

  async details({ view, request, response, session }: HttpContext) {
    const courtId = request.input('court_id')
    const bookingDate = request.input('date')
    const slots = request.input('slots') as string | undefined

    const court = courtId ? await Court.find(courtId) : null
    const slotArr = parseSlots(slots)

    if (
      !court ||
      !bookingDate ||
      !slotArr.length ||
      slotArr.length > MAX_SLOTS ||
      !slotArr.every(isValidSlot) ||
      !isConsecutive(slotArr)
    ) {
      return response.redirect('/booking')
    }

    const timeStart = slotArr[0] ?? ''

    const lastSlot = slotArr[slotArr.length - 1] ?? ''
    const timeEnd = lastSlot ? nextHour(lastSlot) : ''

    const totalPrice = slotArr.length * court.pricePerHour
    const bookingNo = `BK-${(bookingDate ?? '').replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    return view.render('pages/booking_details', {
      court,
      courtId,
      bookingDate,
      slotArr,
      timeStart,
      timeEnd,
      totalPrice,
      bookingNo,
      sessionUser: session.get('user') ?? null,
    })
  }

  async store({ request, response, session }: HttpContext) {
    const bookingData = session.get('booking_data')
    if (!bookingData) return response.redirect('/booking')

    const slip = request.file('payment_slip', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png'],
    })

    if (!slip || !slip.isValid) {
      const errorMsg = !slip
        ? 'กรุณาแนบสลิปการโอนเงิน'
        : slip.errors[0]?.type === 'size'
          ? 'ไฟล์สลิปต้องมีขนาดไม่เกิน 5mb'
          : 'รองรับเฉพาะไฟล์รูปภาพ (.jpg. .jpeg, .png)'
      session.flash('error', errorMsg)
      return response.redirect('/booking/payment')
    }

    const existingBookings = await Booking.query()
      .where('booking_date', bookingData.booking_date)
      .where('court_id', bookingData.court_id)
      .whereNot('status', 'cancelled')

    const bookedSlots = expandBookedSlots(existingBookings)

    const bookingSlots = createBookingSlots(bookingData.time_start, bookingData.time_end)

    const hasBookedSlot = bookingSlots.some((slot) => bookedSlots.includes(slot))

    if (hasBookedSlot) {
      session.flash('error', 'ช่วงเวลาที่เลือกถูกจองไปแล้ว กรุณาเลือกเวลาใหม่')
      session.forget('booking_data')
      return response.redirect(
        `/booking?court=${bookingData.court_id}&date=${bookingData.booking_date}`
      )
    }

    await slip.move(app.publicPath('uploads/slips'))
    const slipPath = `uploads/slips/${slip.fileName}`

    try {
      await db.transaction(async (trx) => {
        const booking = await Booking.create(
          {
            ...bookingData,
            paymentSlip: slipPath,
            status: 'pending',
          },
          { client: trx }
        )

        await trx.table('booking_slots').insert(
          bookingSlots.map((slot) => ({
            booking_id: booking.id,
            court_id: bookingData.court_id,
            booking_date: bookingData.booking_date,
            slot_start: slot,
          }))
        )
      })
    } catch (error) {
      await removeUploadedSlip(slipPath)

      if (isDuplicateSlotError(error)) {
        session.flash('error', 'ช่วงเวลาที่เลือกถูกจองไปแล้ว กรุณาเลือกเวลาใหม่')
        session.forget('booking_data')
        return response.redirect(
          `/booking?court=${bookingData.court_id}&date=${bookingData.booking_date}`
        )
      }

      throw error
    }

    session.forget('booking_data')
    session.flash('success', 'ทำการจองสนามสำเร็จ')
    return response.redirect('/booking')
  }

  async paymentInit({ request, response, session }: HttpContext) {
    const data = await request.validateUsing(storeBookingValidator)
    const court = await Court.find(data.court_id)
    const slotArr = parseSlots(data.slots)

    if (
      !court ||
      !slotArr.length ||
      slotArr.length > MAX_SLOTS ||
      !slotArr.every(isValidSlot) ||
      !isConsecutive(slotArr)
    ) {
      return response.redirect('/booking')
    }

    const bookings = await Booking.query()
      .where('booking_date', data.booking_date)
      .where('court_id', data.court_id)
      .whereNot('status', 'cancelled')

    const bookedSlots = expandBookedSlots(bookings)
    const hasBookedSlot = slotArr.some((slot) => bookedSlots.includes(slot))

    if (hasBookedSlot) {
      return response.redirect(`/booking?court=${data.court_id}&date=${data.booking_date}`)
    }

    const timeStart = slotArr[0]
    const timeEnd = nextHour(slotArr[slotArr.length - 1])
    const totalPrice = slotArr.length * court.pricePerHour
    const bookingNo = `BK-${data.booking_date.replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    session.put('booking_data', {
      booking_no: bookingNo,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email,
      customer_type: data.customer_type,
      court_id: data.court_id,
      booking_date: data.booking_date,
      time_start: timeStart,
      time_end: timeEnd,
      total_price: totalPrice,
      discount: 0,
    })

    return response.redirect('/booking/payment')
  }

  async payment({ view, session, response }: HttpContext) {
    const bookingData = session.get('booking_data')
    if (!bookingData) return response.redirect('/booking')

    const court = await Court.find(bookingData.court_id)

    return view.render('pages/booking_payment', { bookingData, court })
  }
}
