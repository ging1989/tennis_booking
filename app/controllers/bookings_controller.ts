// import type { HttpContext } from '@adonisjs/core/http'

export default class BookingsController {
    async index({view}: HttpContext) {
        return view.render('pages/booking')
    }
}