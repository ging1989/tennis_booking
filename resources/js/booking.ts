
const DEFAULT_PRICE_PER_SLOT = 0
const MAX_SLOTS = 3

const allSlots = [
  '07:00', '08:00', '09:00', '10:00',
  '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00',
]


//แปลงเวลาเป็นนาที
function slotToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)

  return hours * 60 + minutes
}

//บวกเวลาเพิ่มไปอีก 1 ชั่วโมง
function nextHour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)

  return `${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

//ตรวจสอบช่วงเวลาจองใน array ว่าต่อเนื่องกันหรือไม่
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
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  if (selectedDate !== todayStr) return false

  const nowMinutes = today.getHours() * 60 + today.getMinutes()
  return slotToMinutes(time) <= nowMinutes
}

//แปล format วันที่ จาก yy-mm-dd เป็น dd-mm-yy
function formatDate(value: string): string {
  if (!value) return '-'

  const [year, month, day] = value.split('-')

  return `${day}-${month}-${year}`
}

//แปลง json string เป็น array string
function parseBookedSlots(value: string): string[] {
  try {
    return JSON.parse(value || '[]')
  } catch {
    return []
  }
}

// สร้างและจัดการหน้า booking page
function createBookingPage(page: HTMLElement): void {
  const grid = document.getElementById('slot-grid')
  const bookingDate = document.getElementById(
    'booking-date'
  ) as HTMLInputElement | null

  const courtSelect = document.getElementById(
    'court-select'
  ) as HTMLSelectElement | null

  const continueButton = document.getElementById(
    'continue-booking'
  ) as HTMLButtonElement | null

  const courtInfoName = document.querySelector(
    '.court-info-name'
  ) as HTMLElement | null

  const courtInfoDetail = document.querySelector(
    '.court-info-detail'
  ) as HTMLElement | null

  // summary elements
  const selectedLabel = document.getElementById('selected-label')
  const sumCourt = document.getElementById('sum-court')
  const sumDate = document.getElementById('sum-date')
  const sumTime = document.getElementById('sum-time')
  const sumDuration = document.getElementById('sum-duration')
  const sumFee = document.getElementById('sum-fee')
  const sumTotal = document.getElementById('sum-total')

  // ตรวจสอบ element สำคัญ
  if (
    !grid ||
    !bookingDate ||
    !courtSelect ||
    !continueButton ||
    !courtInfoName
  ) {
    return
  }

  // โหลดข้อมูลสนาม
  const parsedPrice = Number(page.dataset.courtPrice)

  let currentCourtName: string =
    page.dataset.courtName || ''

  let currentPricePerSlot: number = isNaN(parsedPrice)
    ? DEFAULT_PRICE_PER_SLOT
    : parsedPrice

  // slot ที่ถูกจองแล้ว
  let bookedSlots: string[] = parseBookedSlots(
    page.dataset.bookedSlots || '[]'
  )

  // slot ที่ผู้ใช้เลือก
  let selectedSlots: string[] = []

  // อัปเดต summary
  function updateSummary(): void {
    const sortedSlots = [...selectedSlots].sort(
      (a, b) => slotToMinutes(a) - slotToMinutes(b)
    )

    const slotCount = sortedSlots.length
    const fee = slotCount * currentPricePerSlot

    if (selectedLabel) {
      selectedLabel.textContent = slotCount
        ? sortedSlots.join(', ')
        : 'none'
    }

    if (sumCourt) {
      sumCourt.textContent = currentCourtName || '-'
    }

    if (sumDate) {
      sumDate.textContent = formatDate(
        bookingDate.value
      )
    }

    if (sumTime) {
      sumTime.textContent = slotCount
        ? `${sortedSlots[0]} - ${nextHour(
            sortedSlots[sortedSlots.length - 1]
          )}`
        : '-'
    }

    if (sumDuration) {
      sumDuration.textContent = slotCount
        ? `${slotCount} hr${slotCount > 1 ? 's' : ''}`
        : '-'
    }

    if (sumFee) {
      sumFee.textContent = slotCount
        ? `฿${fee}`
        : '-'
    }

    if (sumTotal) {
      sumTotal.textContent = `฿${fee}`
    }
  }

  // สร้าง slot เวลา
  function buildSlots(): void {
    grid.innerHTML = allSlots
      .map((time: string) => {
        const isBooked = bookedSlots.includes(time) || isPastSlot(time, bookingDate.value)

        const isSelected =
          selectedSlots.includes(time)

        const statusClass = isBooked
          ? ' booked'
          : isSelected
          ? ' selected'
          : ''

        return `
          <button
            class="slot-card${statusClass}"
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
      })
      .join('')
  }

  // เลือก slot
  function selectSlot(time: string): void {
    if (bookedSlots.includes(time) || isPastSlot(time, bookingDate.value)) {
      return
    }

    // ถ้ากด slot เดิม -> ยกเลิก
    if (selectedSlots.includes(time)) {
      selectedSlots = selectedSlots.filter(
        (slot) => slot !== time
      )
    } else {
      const nextSelectedSlots = [
        ...selectedSlots,
        time,
      ]

      // ถ้าเวลาไม่ต่อเนื่อง -> reset ใหม่
      if (!isConsecutive(nextSelectedSlots)) {
        selectedSlots = [time]
      }
      // เกินจำนวนที่กำหนด
      else if (
        nextSelectedSlots.length > MAX_SLOTS
      ) {
        return
      }
      // เพิ่ม slot
      else {
        selectedSlots.push(time)
      }
    }

    buildSlots()
    updateSummary()
  }

  // เปลี่ยนสนาม
  async function onCourtChange(
    courtId: string
  ): Promise<void> {
    const selectedOption =
      courtSelect.options[
        courtSelect.selectedIndex
      ]

    currentCourtName = courtId
      ? selectedOption.text
      : ''

    const parsedPrice = Number(
      selectedOption.dataset.price
    )

    currentPricePerSlot =
      courtId && !isNaN(parsedPrice)
        ? parsedPrice
        : DEFAULT_PRICE_PER_SLOT

    courtInfoName.textContent =
      currentCourtName || '-'

    if (courtInfoDetail) {
      courtInfoDetail.textContent = courtId
        ? `฿${currentPricePerSlot}/hr`
        : '-'
    }

    try {
      const params = new URLSearchParams({
        date: bookingDate.value,
        court_id: courtId,
      })

      const response = await fetch(
        `/api/available-slots?${params}`
      )

      if (!response.ok) {
        throw new Error(
          'Failed to load available slots'
        )
      }

      const data = await response.json()

      bookedSlots = Array.isArray(
        data.bookedSlots
      )
        ? data.bookedSlots
        : []

      selectedSlots = []

      buildSlots()
      updateSummary()
    } catch (error) {
      console.error(error)

      window.alert(
        'ไม่สามารถโหลดข้อมูลเวลาได้'
      )
    }
  }

  // click slot
  grid.addEventListener('click', (event) => {
    const target = event.target as HTMLElement

    const slotCard = target.closest(
      '[data-slot]'
    ) as HTMLElement | null

    if (!slotCard) {
      return
    }

    const slot = slotCard.dataset.slot

    if (!slot) {
      return
    }

    selectSlot(slot)
  })

  // เปลี่ยนวันที่
  bookingDate.addEventListener(
    'change',
    () => {
      if (courtSelect.value) {
        onCourtChange(courtSelect.value)
      }
    }
  )

  // เปลี่ยนสนาม
  courtSelect.addEventListener(
    'change',
    () => {
      onCourtChange(courtSelect.value)
    }
  )

  // ปุ่ม continue
  continueButton.addEventListener(
    'click',
    () => {
      if (!courtSelect.value) {
        window.alert('กรุณาเลือกสนาม')
        return
      }

      if (!selectedSlots.length) {
        window.alert('กรุณาเลือกเวลา')
        return
      }

      const params =
        new URLSearchParams({
          court_id: courtSelect.value,
          date: bookingDate.value,
          slots: selectedSlots.join(','),
        })

      window.location.href =
        `/booking/details?${params}`
    }
  )

  // preload slot จาก url
  const urlParams = new URLSearchParams(
    window.location.search
  )

  const preselectedTime =
    urlParams.get('time')

  // โหลดข้อมูลเริ่มต้น
  if (courtSelect.value) {
    onCourtChange(courtSelect.value).then(
      () => {
        if (
          preselectedTime &&
          allSlots.includes(preselectedTime) &&
          !bookedSlots.includes(
            preselectedTime
          )
        ) {
          selectedSlots = [preselectedTime]

          buildSlots()
          updateSummary()
        }
      }
    )
  } else {
    buildSlots()
    updateSummary()
  }
}

// เริ่มทำงานเมื่อ DOM โหลดเสร็จ
document.addEventListener(
  'DOMContentLoaded',
  () => {
    const bookingPage =
      document.getElementById(
        'booking-page'
      )

    if (bookingPage) {
      createBookingPage(bookingPage)
    }
  }
)