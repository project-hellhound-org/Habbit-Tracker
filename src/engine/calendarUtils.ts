import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

export function layoutOverlaps(events: {start: Date; end: Date; id: string}[]): Map<string, {lane: number; totalLanes: number}> {
  const result = new Map<string, {lane: number; totalLanes: number}>();
  if (events.length === 0) return result;

  const sorted = [...events].sort((a, b) => {
    if (a.start.getTime() === b.start.getTime()) return b.end.getTime() - a.end.getTime();
    return a.start.getTime() - b.start.getTime();
  });

  let columns: typeof events[] = [];
  let lastEventEnding: Date | null = null;

  const processGroup = () => {
    columns.forEach((col, lane) => {
      col.forEach(evt => {
        result.set(evt.id, { lane, totalLanes: columns.length });
      });
    });
    columns = [];
    lastEventEnding = null;
  };

  for (const event of sorted) {
    if (lastEventEnding !== null && event.start >= lastEventEnding) {
      processGroup();
    }

    let placed = false;
    for (const col of columns) {
      if (col[col.length - 1].end <= event.start) {
        col.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([event]);
    }

    if (lastEventEnding === null || event.end > lastEventEnding) {
      lastEventEnding = event.end;
    }
  }

  if (columns.length > 0) {
    processGroup();
  }

  return result;
}

export function parseRRule(rrule: string): { freq: string; interval: number; byday?: string[]; bymonthday?: number[]; count?: number; until?: Date } {
  const parts = rrule.split(';');
  const result: any = { freq: 'DAILY', interval: 1 };
  
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (!value) continue;
    
    switch (key.toUpperCase()) {
      case 'FREQ': result.freq = value; break;
      case 'INTERVAL': result.interval = parseInt(value, 10); break;
      case 'BYDAY': result.byday = value.split(','); break;
      case 'BYMONTHDAY': result.bymonthday = value.split(',').map(Number); break;
      case 'COUNT': result.count = parseInt(value, 10); break;
      case 'UNTIL': {
        const year = value.substring(0, 4);
        const month = value.substring(4, 6);
        const day = value.substring(6, 8);
        result.until = new Date(`${year}-${month}-${day}T00:00:00Z`);
        break;
      }
    }
  }
  return result;
}

export function expandRecurrence(rrule: string, start: Date, rangeStart: Date, rangeEnd: Date): Date[] {
  const rule = parseRRule(rrule);
  const dates: Date[] = [];
  let current = new Date(start);
  let count = 0;

  const maxCount = rule.count || 1000;
  const until = rule.until ? (rule.until < rangeEnd ? rule.until : rangeEnd) : rangeEnd;
  const dayMap: Record<string, number> = { 'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6 };

  if (rule.freq === 'WEEKLY' && rule.byday) {
    while (current <= until && count < maxCount) {
      for (const dayStr of rule.byday) {
        const targetDay = dayMap[dayStr];
        const currentDay = current.getDay();
        const diff = targetDay - currentDay;
        const candidate = addDays(current, diff);
        if (candidate >= start && candidate <= until && candidate >= rangeStart) {
          dates.push(new Date(candidate));
          count++;
          if (count >= maxCount) break;
        }
      }
      current = addWeeks(current, rule.interval);
    }
  } else {
    while (current <= until && count < maxCount) {
      let match = true;
      if (rule.freq === 'MONTHLY' && rule.bymonthday) {
        if (!rule.bymonthday.includes(current.getDate())) match = false;
      }
      if (match && current >= rangeStart) {
        dates.push(new Date(current));
        count++;
      }
      if (rule.freq === 'DAILY') current = addDays(current, rule.interval);
      else if (rule.freq === 'MONTHLY') current = addMonths(current, rule.interval);
      else if (rule.freq === 'YEARLY') current = addYears(current, rule.interval);
      else current = addDays(current, rule.interval);
    }
  }
  
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

export function generateRRuleOptions(selectedDate: Date): {label: string; value: string}[] {
  const days = ['SU','MO','TU','WE','TH','FR','SA'];
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayIndex = selectedDate.getDay();
  const day = days[dayIndex];
  const dayName = dayNames[dayIndex];
  const date = selectedDate.getDate();
  const weekNumber = Math.ceil(date / 7);
  const nth = ['First', 'Second', 'Third', 'Fourth', 'Fifth'][weekNumber - 1];
  
  return [
    { label: 'Does not repeat', value: '' },
    { label: 'Daily', value: 'FREQ=DAILY' },
    { label: `Weekly on ${dayName}`, value: `FREQ=WEEKLY;BYDAY=${day}` },
    { label: `Monthly on the ${nth} ${dayName}`, value: `FREQ=MONTHLY;BYDAY=${weekNumber}${day}` },
    { label: 'Annually on ' + selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }), value: 'FREQ=YEARLY' },
    { label: 'Every weekday', value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
    { label: 'Custom...', value: 'CUSTOM' }
  ];
}

export function parseTimeString(input: string): { hours: number; minutes: number } | null {
  const match = input.toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3];
  if (ampm === 'pm' && hours < 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;
  return { hours, minutes };
}

export function generateTimeSlots(): { label: string; value: string }[] {
  const slots = [];
  for (let i = 0; i < 24 * 4; i++) {
    const hours = Math.floor(i / 4);
    const minutes = (i % 4) * 15;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    const m = minutes.toString().padStart(2, '0');
    slots.push({ label: `${h}:${m} ${ampm}`, value: `${hours.toString().padStart(2, '0')}:${m}` });
  }
  return slots;
}
