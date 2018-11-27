import {
  addWeeks,
  getDate as getDayOfMonth,
  getMonth,
  setDay,
  subMonths,
  subWeeks,
  format as formatDate
} from 'date-fns'
import { times } from 'lodash'
import h from 'vhtml'

const css = `
  * {
    font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol;
  }
  .month, .wday {
    fill: #767676;
  }
  .month {
    font-size: 10px;
  }
  .wday {
    font-size: 9px;
  }
`

export function createImage(completedDays: Set<string>) {
  return (
    <svg width="669" height="104" xmlns="http://www.w3.org/2000/svg">
      <style>{css}</style>
      <g>
          <g transform="translate(17, 20)">
            {times(53, (i) => createGridColumn(completedDays, i + 1))}
          </g>

          <g transform="translate(29, 10)">
            {times(12, (i) => createMonthLabel(i + 1))}
          </g>

          <text class="wday" dx="2" dy="40">Mon</text>
          <text class="wday" dx="2" dy="64">Wed</text>
          <text class="wday" dx="2" dy="89">Fri</text>
      </g>
  </svg>
  )
}

function createMonthLabel(m: number) {
  return (
    <text class="month" x={getMonthX(m)}>{getMonthLabel(m)}</text>
  )
}

function createGridColumn(completedDays: Set<string>, w: number) {
  return (
    <g>
      { times(7, (d) => createGridBlock(completedDays, w, d)) }
    </g>
  )
}

function createGridBlock(completedDays: Set<string>, w: number, d: number) {
  const date = getDate(w, d)
  const x = 12 * w
  const y = 12 * d
  const fill = getFill(completedDays, date)
  const title = formatDate(date, 'EEEE MMMM do, yyyy')
  return (
    <rect width="10" height="10" x={x} y={y} fill={fill}>
      <title>{title}</title>
    </rect>
  )
}

function getDate(w: number, dw: number) {
  const weeksAgo = 53 - w
  let date = new Date()
  date = subWeeks(date, weeksAgo)
  date = setDay(date, dw)
  return date
}

function getFill(completedDays: Set<string>, date: Date) {
  const now = new Date()
  if (date > now) {
    return 'rgba(0,0,0,0)'
  }
  const isComplete = completedDays.has(formatDate(date, 'yyyy.MM.dd'))
  return isComplete ? '#7bc96f' : '#ebedf0'
}

function getMonthLabel(m: number) {
  const monthsAgo = 12 - m
  const now = new Date()
  const then = subMonths(now, monthsAgo)
  return formatDate(then, 'MMM')
}

function getMonthX(m: number) {
  const monthsAgo = 12 - m
  const now = new Date()
  const targetMonth = getMonth(subMonths(now, monthsAgo))
  let then = setDay(subMonths(now, 12), 0)
  let column = 0
  while (getMonth(then) !== targetMonth || getDayOfMonth(then) > 7) {
    column++
    then = addWeeks(then, 1)
  }
  return 12 * column
}
