/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/


import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const HomeController = () => import('#controllers/home_controller')
const CourtsController = () => import('#controllers/courts_controller')
const BookingsController = () => import('#controllers/bookings_controller')
const AuthController = () => import('#controllers/auth_controller')
const AdminController = () => import('#controllers/admin_controller')

router.get('/', [HomeController, 'index']).as('home')
router.get('/login', [AuthController, 'showLogin']).as('login')
router.post('/login', [AuthController, 'login'])
router.post('/logout', [AuthController, 'logout'])
router.get('/register', [AuthController, 'showRegister']).as('register')
router.post('/register', [AuthController, 'register'])
router.get('/court', [CourtsController, 'index']).as('courts')

router.get('/booking', [BookingsController, 'index']).as('bookings')
router.get('/api/available-slots', [BookingsController, 'availableSlots'])
router.get('/booking/details', [BookingsController, 'details'])
router.post('/booking/store', [BookingsController, 'store']).as('booking_store')
router.post('/booking/payment-init', [BookingsController, 'paymentInit'])
router.get('/booking/payment', [BookingsController, 'payment'])
router.get('/booking/success/:bookingNo', [BookingsController, 'bookingSuccess'])
router.get('/check-booking', [BookingsController, 'checkBooking'])

router.get('/my-bookings', [BookingsController, 'myBookings'])

router.group(() => {
    router.get('/admin/bookings', [AdminController, 'bookings'])
    router.get('/admin/courts', [AdminController, 'courts'])
    router.get('/admin/courts/:id/edit', [AdminController, 'editCourt'])
    router.post('/admin/courts/:id', [AdminController, 'updateCourt'])
    router.post('/admin/bookings/:id/confirm', [AdminController, 'confirmBooking'])
    router.post('/admin/bookings/:id/cancel', [AdminController, 'cancelBooking'])
}).use(middleware.admin())
