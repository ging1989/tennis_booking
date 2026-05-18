import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import Court from '#models/court'

export default class AdminController {
    async bookings({ view, auth }: HttpContext) {

        const bookings = await Booking.query()
            .preload('court')
            .orderBy('created_at', 'desc')

        return view.render('pages/admin/bookings', { bookings, adminUser: auth.user })
    }

    async courts({ view, auth }: HttpContext) {

        const courts = await Court.query().orderBy('court_name', 'asc')

        return view.render('pages/admin/courts', { courts, adminUser: auth.user })
    }

    async editCourt({ params, view, auth, response }: HttpContext) {

        const court = await Court.find(params.id)

        if (!court) {
            return response.redirect('/admin/courts')
        }

        return view.render('pages/admin/edit_court', { court, adminUser: auth.user })
    }

    async updateCourt({ params, request, response }: HttpContext) {

        const court = await Court.find(params.id)

        if (!court) {
            return response.redirect('/admin/courts')
        }

        const VALID_STATUSES = ['available', 'maintenance']

        const data = request.only(['court_name', 'price_per_hour', 'status'])
        const price = Number(data.price_per_hour)

        if (!data.court_name?.trim() || isNaN(price) || price < 0 || !VALID_STATUSES.includes(data.status)) {
            return response.redirect('/admin/courts')
        }

        court.courtName = data.court_name.trim()
        court.pricePerHour = price
        court.status = data.status

        await court.save()

        return response.redirect('/admin/courts')
    }

    async confirmBooking({ params, response}: HttpContext) {

        const booking = await Booking.find(params.id)

        if (!booking) {
            return response.redirect('/admin/bookings')
        }

        booking.status = 'confirmed'
        await booking.save()

        return response.redirect('/admin/bookings')
    }

    async cancelBooking({ params, response }: HttpContext) {

        const booking = await Booking.find(params.id)

        if (!booking) {
            return response.redirect('/admin/bookings')
        }

        booking.status = 'cancelled'
        await booking.save()

        return response.redirect('/admin/bookings')
    }

}
