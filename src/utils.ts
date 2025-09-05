export function formatDate(input: string | number | Date) {
  const d = new Date(input)
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

export function fullName(s: { firstName?: string; lastName?: string }) {
  return [s.firstName, s.lastName].filter(Boolean).join(' ')
}

// Normalize string: lowercase + remove accents/diacritics
export function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
