import type { HttpContext } from '@adonisjs/core/http'
import Court from '#models/court'
import Booking from '#models/booking'
import { storeBookingValidator } from '#validators/booking_validator'

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

        if (!date || !courtId) {
            return response.badRequest({error: 'date and court id are required'})
        }

        const bookings = await Booking.query()
            .where('booking_date', date)
            .where('court_id', courtId)

        const bookedSlots = bookings.map((b) => b.timeStart.substring(0,5))

        return response.json({bookedSlots})
    }

    async details({view, request}: HttpContext) {
        const courtId = request.input('court_id')
        const bookingDate = request.input('date')
        const slots = request.input('slots')

        const court = courtId ? await Court.find(courtId) : null
        const slotArr: string[] = slots ? slots.split(',').sort(): []
        const timeStart = slotArr[0] ?? ''

        const lastSlot = slotArr[slotArr.length - 1] ?? ''
        const [h] = lastSlot.split(':').map(Number)
        const timeEnd = lastSlot ? `${String(h + 1).padStart(2, '0')}:00` : ''
       
        const totalPrice = slotArr.length*300
        const bookingNo = `BK-${(bookingDate ?? '').replace(/-/g,'')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        
        return view.render('pages/booking_details', {
            court, courtId, bookingDate, slotArr, timeStart, timeEnd, totalPrice, bookingNo})
    }

    async store({request, response}: HttpContext) {
        const data = await request.validateUsing(storeBookingValidator)
        await Booking.create(data)
        
        return response.redirect('/booking')
    }

}