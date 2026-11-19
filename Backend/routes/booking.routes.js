const express = require('express')
const { restrictToRole } = require('../middlewares/auth.middleware')
const controller = require('../controllers/booking.controller')

const router = express.Router()

// Public: seat map status for browsing before sign-in
router.post('/seat-status', controller.getLockedAndBookedSeats)

router.use(restrictToRole('user'))

router.post('/create', controller.handleCreateBooking)
router.post('/verify-payment', controller.verifyPayment)
router.post('/createBooking', controller.createBooking)
router.post('/show', controller.getShowBooking)
router.get('/my-bookings', controller.getUserBookings)
router.delete('/:bookingId', controller.cancelBooking)
router.post('/lock-seats', controller.lockSeats)
router.post('/unlock-seats', controller.unlockSeats)

module.exports = router
