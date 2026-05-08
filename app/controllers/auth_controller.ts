import type { HttpContext } from '@adonisjs/core/http'

export default class AuthController {
    async showLogin({view}: HttpContext) {
        return view.render('pages/login')
    }
}