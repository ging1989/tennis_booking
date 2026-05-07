
const PRICE_PER_SLOT = 300
const MAX_SLOTS = 3

const allSlots = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
]

function slotToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)

  return hours * 60 + minutes
}

function nextHour(time) {
  const [hours, minutes] = time.split(':').map(Number)

  return `${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function isConsecutive(slots) {
  if (slots.length <= 1) return true

  const sortedSlots = [...slots].sort((a, b) => slotToMinutes(a) - slotToMinutes(b))

  for (let index = 1; index < sortedSlots.length; index++) {
    if (slotToMinutes(sortedSlots[index]) - slotToMinutes(sortedSlots[index - 1]) !== 60) {
      return false
    }
  }

  return true
}

function formatDate(value) {
  if (!value) return '-'

  const [year, month, day] = value.split('-')

  return `${day}-${month}-${year}`
}

function parseBookedSlots(value) {
  try {
    return JSON.parse(value || '[]')
  } catch {
    return []
  }
}

function createBookingPage(page) {
  const grid = document.getElementById('slot-grid')
  const bookingDate = document.getElementById('booking-date')
  const courtSelect = document.getElementById('court-select')
  const continueButton = document.getElementById('continue-booking')
  const courtInfoName = document.querySelector('.court-info-name')

  if (!grid || !bookingDate || !courtSelect || !continueButton) return

  let currentCourtName = page.dataset.courtName || ''
  let bookedSlots = parseBookedSlots(page.dataset.bookedSlots)
  let selectedSlots = []

  function updateSummary() {
    const sortedSlots = [...selectedSlots].sort((a, b) => slotToMinutes(a) - slotToMinutes(b))
    const slotCount = sortedSlots.length
    const fee = slotCount * PRICE_PER_SLOT

    document.getElementById('selected-label').textContent = slotCount ? sortedSlots.join(', ') : 'none'
    document.getElementById('sum-court').textContent = currentCourtName || '-'
    document.getElementById('sum-date').textContent = formatDate(bookingDate.value)
    document.getElementById('sum-time').textContent = slotCount
      ? `${sortedSlots[0]} - ${nextHour(sortedSlots[sortedSlots.length - 1])}`
      : '-'
    document.getElementById('sum-duration').textContent = slotCount
      ? `${slotCount} hr${slotCount > 1 ? 's' : ''}`
      : '-'
    document.getElementById('sum-fee').textContent = slotCount ? `฿${fee}` : '-'
    document.getElementById('sum-total').textContent = `฿${fee}`
  }

  function buildSlots() {
    grid.innerHTML = allSlots
      .map((time) => {
        const isBooked = bookedSlots.includes(time)
        const isSelected = selectedSlots.includes(time)
        const statusClass = isBooked ? ' booked' : isSelected ? ' selected' : ''

        return `
          <button class="slot-card${statusClass}" type="button" data-slot="${time}" ${
            isBooked ? 'disabled' : ''
          }>
            <span class="slot-start">${time}</span>
            <span class="slot-end">-${nextHour(time)}</span>
          </button>`
      })
      .join('')
  }

  function selectSlot(time) {
    if (bookedSlots.includes(time)) return

    if (selectedSlots.includes(time)) {
      selectedSlots = selectedSlots.filter((slot) => slot !== time)
    } else {
      const nextSelectedSlots = [...selectedSlots, time]

      if (!isConsecutive(nextSelectedSlots)) {
        selectedSlots = [time]
      } else if (nextSelectedSlots.length > MAX_SLOTS) {
        return
      } else {
        selectedSlots.push(time)
      }
    }

    buildSlots()
    updateSummary()
  }

  async function onCourtChange(courtId) {
    const selectedOption = courtSelect.options[courtSelect.selectedIndex]

    currentCourtName = courtId ? selectedOption.text : ''
    if (courtInfoName) courtInfoName.textContent = currentCourtName

    const params = new URLSearchParams({
      date: bookingDate.value,
      court_id: courtId,
    })
    const response = await fetch(`/api/available-slots?${params}`)
    const data = await response.json()

    bookedSlots = data.bookedSlots || []
    selectedSlots = []
    buildSlots()
    updateSummary()
  }

  grid.addEventListener('click', (event) => {
    const slotCard = event.target.closest('[data-slot]')

    if (!slotCard) return
    selectSlot(slotCard.dataset.slot)
  })

  bookingDate.addEventListener('change', () => {
    if (courtSelect.value) onCourtChange(courtSelect.value)
  })

  courtSelect.addEventListener('change', () => {
    onCourtChange(courtSelect.value)
  })

  continueButton.addEventListener('click', () => {
    if (!selectedSlots.length) {
      window.alert('กรุณาเลือกเวลา')
      return
    }

    const params = new URLSearchParams({
      court_id: courtSelect.value,
      date: bookingDate.value,
      slots: selectedSlots.join(',')
    })

    window.location.href = `/booking/details?${params}`
  })

  const urlParams = new URLSearchParams(window.location.search)
  const preselectedTime = urlParams.get('time')

  if (courtSelect.value) {
    onCourtChange(courtSelect.value).then(() => {
      if (preselectedTime && allSlots.includes(preselectedTime) && !bookedSlots.includes(preselectedTime)) {
        selectedSlots = [preselectedTime]
        buildSlots()
        updateSummary()
      }
    })
  } else {
      buildSlots()
      updateSummary()
    }
  }

document.addEventListener('DOMContentLoaded', () => {
  const bookingPage = document.getElementById('booking-page')

  if (bookingPage) createBookingPage(bookingPage)
})
