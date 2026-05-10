import '../css/app.css'
import './booking'

interface SemanticDropdown extends JQuery<HTMLElement> {
  dropdown(options: { on: string }): JQuery<HTMLElement>
}

$(document).ready(() => {
  const dropdowns = $('.ui.dropdown') as SemanticDropdown
  dropdowns.dropdown({ on: 'click' })
})
