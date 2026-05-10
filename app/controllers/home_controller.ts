import type { HttpContext } from '@adonisjs/core/http'
import Court from '#models/court'

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

export default class HomeController {
  async index({ view }: HttpContext) {
    const courts = await Court.query().orderBy('id', 'asc')
    const currentMinutes = getBangkokMinutesNow()

    const courtSlots = courts.map((court) => {
      const slots = OPEN_HOURS.map((hour) => {
        const isPast = getHourMinutes(hour) <= currentMinutes

        return {
          time: hour,
          isPast,
          available: court.status === 'available' && !isPast,
        }
      })

      return { court, slots }
    })

    return view.render('pages/home', { courtSlots })
  }
}
