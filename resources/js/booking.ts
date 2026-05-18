const DEFAULT_PRICE_PER_SLOT = 0
const MAX_SLOTS = 3

const ALL_SLOTS = [
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

function slotToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function nextHour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  return `${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function isConsecutive(slots: string[]): boolean {
  if (slots.length <= 1) return true

  const sortedSlots = [...slots].sort((a, b) => slotToMinutes(a) - slotToMinutes(b))

  for (let index = 1; index < sortedSlots.length; index++) {
    if (slotToMinutes(sortedSlots[index]) - slotToMinutes(sortedSlots[index - 1]) !== 60) {
      return false
    }
  }

  return true
}

function isPastSlot(time: string, selectedDate: string): boolean {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayText = `${year}-${month}-${day}`

  if (selectedDate !== todayText) return false

  const nowMinutes = today.getHours() * 60 + today.getMinutes()
  return slotToMinutes(time) <= nowMinutes
}

function formatDate(value: string): string {
  if (!value) return '-'

  const [year, month, day] = value.split('-')

  return `${day}-${month}-${year}`
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function createDateCarousel(dateInput: HTMLInputElement, onChange: () => void): void {
  const track = document.getElementById('date-track')
  const prevBtn = document.getElementById('date-prev') as HTMLButtonElement | null
  const nextBtn = document.getElementById('date-next') as HTMLButtonElement | null

  if (!track || !prevBtn || !nextBtn) return

  const DAYS_AHEAD = 30
  const VISIBLE = 4

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dates: Date[] = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })

  let selectedDate = dateInput.value || toISODate(today)
  dateInput.value = selectedDate

  const initialIndex = dates.findIndex((d) => toISODate(d) === selectedDate)
  let windowStart = Math.max(0, Math.min(initialIndex, dates.length - VISIBLE))

  function render(): void {
    const slice = dates.slice(windowStart, windowStart + VISIBLE)
    track!.innerHTML = slice
      .map((d) => {
        const iso = toISODate(d)
        const isSelected = iso === selectedDate
        const weekday = d.toLocaleDateString('th-TH', { weekday: 'short' })
        const label = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
        return `<button type="button" class="date-btn${isSelected ? ' selected' : ''}" data-date="${iso}">
          <span class="date-btn-day">${weekday}</span>
          <span class="date-btn-num">${label}</span>
        </button>`
      })
      .join('')

    prevBtn!.disabled = windowStart === 0
    nextBtn!.disabled = windowStart + VISIBLE >= dates.length
  }

  track.addEventListener('click', (event) => {
    const btn = (event.target as HTMLElement).closest('.date-btn') as HTMLElement | null
    if (!btn) return
    selectedDate = btn.dataset.date || selectedDate
    dateInput.value = selectedDate
    render()
    onChange()
  })

  prevBtn.addEventListener('click', () => {
    if (windowStart > 0) { windowStart--; render() }
  })

  nextBtn.addEventListener('click', () => {
    if (windowStart + VISIBLE < dates.length) { windowStart++; render() }
  })

  render()
}

function parseBookedSlots(value: string): string[] {
  try {
    return JSON.parse(value || '[]')
  } catch {
    return []
  }
}

function createBookingPage(page: HTMLElement): void {
  const grid = document.getElementById('slot-grid')
  const bookingDate = document.getElementById('booking-date') as HTMLInputElement | null
  const courtInput = document.getElementById('court-select') as HTMLInputElement | null
  const courtBtnGroup = document.getElementById('court-btn-group') as HTMLElement | null
  const continueButton = document.getElementById('continue-booking') as HTMLButtonElement | null
  const courtInfoName = document.querySelector('.court-info-name') as HTMLElement | null
  const courtInfoDetail = document.querySelector('.court-info-detail') as HTMLElement | null

  const selectedLabel = document.getElementById('selected-label')
  const sumCourt = document.getElementById('sum-court')
  const sumDate = document.getElementById('sum-date')
  const sumTime = document.getElementById('sum-time')
  const sumDuration = document.getElementById('sum-duration')
  const sumFee = document.getElementById('sum-fee')
  const sumTotal = document.getElementById('sum-total')

  if (!grid || !bookingDate || !courtInput || !continueButton || !courtInfoName) {
    return
  }

  const slotGrid = grid
  const dateInput = bookingDate
  const nextButton = continueButton
  const courtNameText = courtInfoName

  const parsedPrice = Number(page.dataset.courtPrice)

  let currentCourtName = page.dataset.courtName || ''
  let currentPricePerSlot = Number.isNaN(parsedPrice) ? DEFAULT_PRICE_PER_SLOT : parsedPrice

  let bookedSlots = parseBookedSlots(page.dataset.bookedSlots || '[]')
  let selectedSlots: string[] = []

  function getSortedSelectedSlots(): string[] {
    return [...selectedSlots].sort((a, b) => slotToMinutes(a) - slotToMinutes(b))
  }

  function getSelectedFee(slotCount: number): number {
    return slotCount * currentPricePerSlot
  }

  function updateSummary(): void {
    const sortedSlots = getSortedSelectedSlots()
    const slotCount = sortedSlots.length
    const fee = getSelectedFee(slotCount)

    if (selectedLabel) {
      selectedLabel.textContent = slotCount ? sortedSlots.join(', ') : 'none'
    }

    if (sumCourt) {
      sumCourt.textContent = currentCourtName || '-'
    }

    if (sumDate) {
      sumDate.textContent = formatDate(dateInput.value)
    }

    if (sumTime) {
      sumTime.textContent = slotCount
        ? `${sortedSlots[0]} - ${nextHour(sortedSlots[sortedSlots.length - 1])}`
        : '-'
    }

    if (sumDuration) {
      sumDuration.textContent = slotCount ? `${slotCount} hr${slotCount > 1 ? 's' : ''}` : '-'
    }

    if (sumFee) {
      sumFee.textContent = slotCount ? `฿${fee}` : '-'
    }

    if (sumTotal) {
      sumTotal.textContent = `฿${fee}`
    }
  }

  function slotIsUnavailable(time: string): boolean {
    return bookedSlots.includes(time) || isPastSlot(time, dateInput.value)
  }

  function getSlotClass(time: string): string {
    if (slotIsUnavailable(time)) return ' booked'
    if (selectedSlots.includes(time)) return ' selected'

    return ''
  }

  function buildSlots(): void {
    slotGrid.innerHTML = ALL_SLOTS.map((time) => {
      const isBooked = slotIsUnavailable(time)

      return `
          <button
            class="slot-card${getSlotClass(time)}"
            type="button"
            data-slot="${time}"
            ${isBooked ? 'disabled' : ''}
          >
            <span class="slot-start">
              ${time}
            </span>

            <span class="slot-end">
              -${nextHour(time)}
            </span>
          </button>
        `
    }).join('')
  }

  function selectSlot(time: string): void {
    if (slotIsUnavailable(time)) {
      return
    }

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

  async function onCourtChange(courtId: string, courtName: string, pricePerHour: number): Promise<void> {
    courtInput!.value = courtId
    currentCourtName = courtName
    currentPricePerSlot = courtId ? pricePerHour : DEFAULT_PRICE_PER_SLOT

    courtNameText.textContent = currentCourtName || '-'

    if (courtInfoDetail) {
      courtInfoDetail.textContent = courtId ? `฿${currentPricePerSlot}/hr` : '-'
    }

    try {
      const params = new URLSearchParams({
        date: dateInput.value,
        court_id: courtId,
      })

      const response = await fetch(`/api/available-slots?${params}`)

      if (!response.ok) {
        throw new Error('Failed to load available slots')
      }

      const data = await response.json()

      bookedSlots = Array.isArray(data.bookedSlots) ? data.bookedSlots : []
      selectedSlots = []

      buildSlots()
      updateSummary()
    } catch (error) {
      console.error(error)

      window.alert('ไม่สามารถโหลดข้อมูลเวลาได้')
    }
  }

  slotGrid.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const slotCard = target.closest('[data-slot]') as HTMLElement | null

    if (!slotCard) {
      return
    }

    const slot = slotCard.dataset.slot

    if (!slot) {
      return
    }

    selectSlot(slot)
  })

  createDateCarousel(dateInput, () => {
    if (courtInput!.value) {
      const activeBtn = courtBtnGroup?.querySelector('.court-btn.selected') as HTMLElement | null
      onCourtChange(
        courtInput!.value,
        activeBtn?.dataset.courtName || currentCourtName,
        Number(activeBtn?.dataset.price) || currentPricePerSlot
      )
    }
  })

  courtBtnGroup?.addEventListener('click', (event) => {
    const btn = (event.target as HTMLElement).closest('.court-btn') as HTMLElement | null
    if(!btn) return

    courtBtnGroup.querySelectorAll('.court-btn').forEach((b) => b.classList.remove('selected'))
    btn.classList.add('selected')

    onCourtChange(
      btn.dataset.courtId || '',
      btn.dataset.courtName || '',
      Number(btn.dataset.price) || DEFAULT_PRICE_PER_SLOT 
    )
  })

  nextButton.addEventListener('click', () => {
    if (!courtInput.value) {
      window.alert('กรุณาเลือกสนาม')
      return
    }

    if (!selectedSlots.length) {
      window.alert('กรุณาเลือกเวลา')
      return
    }

    const params = new URLSearchParams({
      court_id: courtInput.value,
      date: dateInput.value,
      slots: selectedSlots.join(','),
    })

    window.location.href = `/booking/details?${params}`
  })

  const urlParams = new URLSearchParams(window.location.search)
  const preselectedTime = urlParams.get('time')

  if (courtInput.value) {
    const activeBtn = courtBtnGroup?.querySelector('.court-btn.selected') as HTMLElement | null
    onCourtChange(
      courtInput.value,
      activeBtn?.dataset.courtName || page.dataset.courtName || '',
      Number(activeBtn?.dataset.price) || Number(page.dataset.courtPrice) || DEFAULT_PRICE_PER_SLOT
    ).then(() => {
      if (
        preselectedTime &&
        ALL_SLOTS.includes(preselectedTime) &&
        !bookedSlots.includes(preselectedTime)
      ) {
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

  if (bookingPage) {
    createBookingPage(bookingPage)
  }
})
