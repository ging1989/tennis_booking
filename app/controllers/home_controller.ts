import type { HttpContext } from '@adonisjs/core/http'
import Court from '#models/court'
import Booking from '#models/booking'

const OPEN_HOURS = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
]

function getBangkokMinutesNow() {
  const now = new Date()
  const bangkokHour = (now.getUTCHours() + 7) % 24

  return bangkokHour * 60 + now.getUTCMinutes()
}

function getHourMinutes(hour: string) {
  return Number(hour.split(':')[0]) * 60
}

function slotToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)

  return hours * 60 + minutes
}

function getBangkokToday() {
  const now = new Date()
  const bangkokMs = now.getTime() + 7 * 60 * 60 *1000

  return new Date(bangkokMs).toISOString().split('T')[0]
}

export default class HomeController {
  async index({ view }: HttpContext) {
    const courts = await Court.query().orderBy('id', 'asc')
    const currentMinutes = getBangkokMinutesNow()

    const bookings = await Booking.query()
      .where('booking_date', getBangkokToday())
      .whereNot('status', 'cancelled')

    const bookedSlotsByCourt = new Map<number, Set<string>>()
    for (const booking of bookings) {
      if(!bookedSlotsByCourt.has(booking.courtId)) {
        bookedSlotsByCourt.set(booking.courtId, new Set())
      }

      const slots = bookedSlotsByCourt.get(booking.courtId)!
      let cur = booking.timeStart.substring(0, 5)
      const end = booking.timeEnd.substring(0, 5)
      while(slotToMinutes(cur) < slotToMinutes(end)) {
        slots.add(cur)
        const h = Number(cur.split(':')[0])
        cur = `${String(h + 1).padStart(2, '0')}:00`
      }
    }



    const courtSlots = courts.map((court) => {
      const bookedSlots = bookedSlotsByCourt.get(court.id) ?? new Set()
      const slots = OPEN_HOURS.map((hour) => {
        const isPast = getHourMinutes(hour) <= currentMinutes

        return {
          time: hour,
          isPast,
          available: court.status === 'available' && !isPast && !bookedSlots.has(hour),
        }
      })

      return { court, slots }
    })

    return view.render('pages/home', { courtSlots })
  }
}
