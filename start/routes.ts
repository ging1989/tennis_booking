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
const BookingsController = () => import('#controllers/bookings_controller')
const AuthController = () => import('#controllers/auth_controller')

router.get('/', [HomeController, 'index']).as('home')
router.get('/login', [AuthController, 'showLogin']).as('login')
router.post('/login', [AuthController, 'login'])
router.get('/logout', [AuthController, 'logout'])
router.get('/register', [AuthController, 'showRegister']).as('register')
router.post('/register', [AuthController, 'register'])
router.get('/court', [CourtsController, 'index']).as('courts')

router.get('/booking', [BookingsController, 'index']).as('bookings')
router.get('/api/available-slots', [BookingsController, 'availableSlots'])
router.get('/booking/details', [BookingsController, 'details'])
router.post('/booking/store', [BookingsController, 'store']).as('booking_store')
router.post('/booking/payment-init', [BookingsController, 'paymentInit'])
router.get('/booking/payment', [BookingsController, 'payment'])

router.get('/check-booking', [BookingsController, 'checkBooking'])
router.post('/check-booking', [BookingsController, 'searchBooking'])

router.get('/my-bookings', [BookingsController, 'myBookings'])

