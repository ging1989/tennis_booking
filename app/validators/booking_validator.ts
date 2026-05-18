import vine from '@vinejs/vine'

export const storeBookingValidator = vine.compile(
  vine.object({
    booking_no: vine.string().trim(),
    customer_name: vine.string().trim(),
    customer_phone: vine.string().trim(),
    customer_email: vine.string().trim().email(),
    customer_type: vine.enum(['guest', 'member']),
    court_id: vine.number().positive(),
    booking_date: vine.string().trim(),
    slots: vine.string().trim(),
  })
)
