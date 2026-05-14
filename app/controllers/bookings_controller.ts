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

type BookingData = {
  booking_no: string
  customer_name: string
  customer_phone: string
  customer_email: string
  customer_type: 'guest' | 'member'
  court_id: number
  booking_date: string
  time_start: string
  time_end: string
  total_price: number
  discount: number
}

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
  const slotCount = (slotToMinutes(timeEnd) - slotToMinutes(timeStart)) / 60
  const startHour = Number(timeStart.substring(0, 2))

  return Array.from({ length: slotCount }, (_, index) => {
    const hour = startHour + index
    return `${String(hour).padStart(2, '0')}:00`
  })
}

function isDuplicateSlotError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const dbError = error as { code?: string; errno?: number }
  return dbError.code === 'ER_DUP_ENTRY' || dbError.errno === 1062
}

function createBookingNo(date: string) {
  const dateText = date.replace(/-/g, '')
  const randomText = Math.random().toString(36).substring(2, 6).toUpperCase()

  return `${dateText}-${randomText}`
}

function getSelectedTime(slots: string[]) {
  const firstSlot = slots[0]
  const lastSlot = slots[slots.length - 1]

  return {
    timeStart: firstSlot,
    timeEnd: nextHour(lastSlot),
  }
}

function slotsAreReady(slots: string[]) {
  return (
    slots.length > 0 &&
    slots.length <= MAX_SLOTS &&
    slots.every(isValidSlot) &&
    isConsecutive(slots)
  )
}

async function getBookedSlots(bookingDate: string, courtId: number | string) {
  const bookings = await Booking.query()
    .where('booking_date', bookingDate)
    .where('court_id', courtId)
    .whereNot('status', 'cancelled')

  return expandBookedSlots(bookings)
}

function hasBookedSlot(selectedSlots: string[], bookedSlots: string[]) {
  return selectedSlots.some((slot) => bookedSlots.includes(slot))
}

function getSlipErrorMessage(slip: { errors: { type?: string }[] } | null) {
  if (!slip) return 'กรุณาแนบสลิปการโอนเงิน'
  if (slip.errors[0]?.type === 'size') return 'ไฟล์สลิปต้องมีขนาดไม่เกิน 5mb'

  return 'รองรับเฉพาะไฟล์รูปภาพ (.jpg. .jpeg, .png)'
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

    const bookedSlots = await getBookedSlots(date, courtId)

    return response.json({ bookedSlots })
  }

  async details({ view, request, response, session }: HttpContext) {
    const courtId = request.input('court_id')
    const bookingDate = request.input('date')
    const slots = request.input('slots') as string | undefined

    const court = courtId ? await Court.find(courtId) : null
    const slotArr = parseSlots(slots)

    if (!court || !bookingDate || !slotsAreReady(slotArr)) {
      return response.redirect('/booking')
    }

    const { timeStart, timeEnd } = getSelectedTime(slotArr)
    const totalPrice = slotArr.length * court.pricePerHour
    const bookingNo = createBookingNo(bookingDate)

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
      session.flash('error', getSlipErrorMessage(slip))
      return response.redirect('/booking/payment')
    }

    const bookedSlots = await getBookedSlots(bookingData.booking_date, bookingData.court_id)
    const bookingSlots = createBookingSlots(bookingData.time_start, bookingData.time_end)
    const selectedSlotIsBooked = hasBookedSlot(bookingSlots, bookedSlots)

    if (selectedSlotIsBooked) {
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
    return response.redirect('/')
  }

  async paymentInit({ request, response, session }: HttpContext) {
    const data = await request.validateUsing(storeBookingValidator)
    const court = await Court.find(data.court_id)
    const slotArr = parseSlots(data.slots)

    if (!court || !slotsAreReady(slotArr)) {
      return response.redirect('/booking')
    }

    const bookedSlots = await getBookedSlots(data.booking_date, data.court_id)
    const selectedSlotIsBooked = hasBookedSlot(slotArr, bookedSlots)

    if (selectedSlotIsBooked) {
      return response.redirect(`/booking?court=${data.court_id}&date=${data.booking_date}`)
    }

    const { timeStart, timeEnd } = getSelectedTime(slotArr)
    const totalPrice = slotArr.length * court.pricePerHour

    const bookingData: BookingData = {
      booking_no: createBookingNo(data.booking_date),
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
    }

    session.put('booking_data', bookingData)

    return response.redirect('/booking/payment')
  }

  async payment({ view, session, response }: HttpContext) {
    const bookingData = session.get('booking_data')
    if (!bookingData) return response.redirect('/booking')

    const court = await Court.find(bookingData.court_id)

    return view.render('pages/booking_payment', { bookingData, court })
  }

  async checkBooking({ view }: HttpContext) {
    return view.render('pages/check_booking', { booking: null })
  }

  async searchBooking({ request, view }: HttpContext) {
    const bookingNo = request.input('booking_no')
    const contact = request.input('contact')

    const booking = await Booking.query()
      .where('booking_no', bookingNo)
      .where((q) => {
        q.where('customer_email', contact).orWhere('customer_phone', contact)
      })
      .preload('court')
      .first()
    
    return view.render('pages/check_booking', { booking })
  }
}
