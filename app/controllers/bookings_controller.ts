import type { HttpContext } from '@adonisjs/core/http'
import Court from '#models/court'
import Booking from '#models/booking'

export default class BookingsController {
    async index({view, request}: HttpContext) {
        const courts = await Court.query().orderBy('court_name', 'asc')
        const courtId = request.input('court')
        const court = courtId ? await Court.find(courtId) : null
        const bookingDate = request.input('date') || new Date().toISOString().split('T')[0]
        return view.render('pages/booking', { courts, court, bookingDate })
    }


    async availableSlots({request, response}: HttpContext) {
        const date = request.input('date')
        const courtId = request.input('court_id')

        const bookings = await Booking.query()
            .where('booking_date', date)
            .where('court_id', courtId)

        const bookedSlots = bookings.map((b) => b.timeStart.substring(0,5))

        return response.json({bookedSlots})
    }


}