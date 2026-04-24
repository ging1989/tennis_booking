import type { HttpContext } from '@adonisjs/core/http'
import Court from '#models/court'

export default class HomeController {
    async index({view}: HttpContext) {
        const courts = await Court.query().orderBy('id', 'asc')
        return view.render('pages/home', {courts})
    }
}