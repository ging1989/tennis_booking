import type { HttpContext } from '@adonisjs/core/http'
import Court from '#models/court'

export default class HomeController {
    async index({view}: HttpContext) {
        const courts = await Court.query().orderBy('id', 'asc')

        const hours = [
            '07:00', '08:00', '09:00', '10:00', 
            '11:00', '12:00', '13:00', '14:00', 
            '15:00', '16:00', '17:00', '18:00', 
            '19:00', '20:00', '21:00', '22:00',
        ]
        
        const courtSlots = courts.map((court) => {
            return {
                court,
                slots: hours.map((hour) => {
                    return {
                        time: hour,
                        available: court.status === 'available',
                    }
                })
            }
        })
        return view.render('pages/home', {courtSlots})
        
    }
}