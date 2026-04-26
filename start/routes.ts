/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const HomeController = () => import('#controllers/home_controller')
const CourtsController = () => import('#controllers/courts_controller')
const BookingsController =() => import('#controllers/bookings_controller')


router.get('/', [HomeController, 'index']).as('home')

router.get('/court', [CourtsController, 'index']).as('courts')

router.get('/booking', [BookingsController, 'index']).as('bookings')
