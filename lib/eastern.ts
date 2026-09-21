export function easternParts(from = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(from);
  const get = (type: string) => parts.find(part => part.type === type)?.value || '';
  let hour = get('hour');
  if (hour === '24') hour = '00';
  return {date: `${get('year')}-${get('month')}-${get('day')}`, time: `${hour}:${get('minute')}`};
}

export function easternPlusMinutes(minutes: number) {
  return easternParts(new Date(Date.now() + minutes * 60_000));
}
