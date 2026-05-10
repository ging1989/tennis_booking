import type { HttpContext } from '@adonisjs/core/http'
import Court from '#models/court'

export default class HomeController {
    async index({ view }: HttpContext) {
        const courts = await Court.query().orderBy('id', 'asc')

        const hours = [
            '07:00', '08:00', '09:00', '10:00', 
            '11:00', '12:00', '13:00', '14:00', 
            '15:00', '16:00', '17:00', '18:00', 
            '19:00', '20:00', '21:00', '22:00',
        ]

        const now = new Date()
        const bangkokHour = (now.getUTCHours() + 7) % 24
        const currentMinutes = bangkokHour * 60 + now.getUTCMinutes()
        
        const courtSlots = courts.map((court) => {
            return {
                court,
                slots: hours.map((hour) => {
                    const slotToMinutes = Number(hour.split(':')[0]) * 60
                    const isPast = slotToMinutes <= currentMinutes
                    return {
                        time: hour,
                        available: court.status === 'available' && !isPast, isPast
                    }
                })
            }
        })
        return view.render('pages/home', {courtSlots})
        
    }
}