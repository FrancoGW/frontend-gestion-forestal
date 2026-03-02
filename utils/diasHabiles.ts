/**
 * Cuenta cuántos días hábiles (lun–vie) han pasado desde la fecha dada hasta hoy.
 * "Días hábiles sin ingresar": si entró el lunes y hoy es viernes, cuenta mar, mié, jue, vie = 4.
 * Si la fecha es hoy, devuelve 0.
 */
export function diasHabilesDesde(fecha: Date): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const f = new Date(fecha)
  f.setHours(0, 0, 0, 0)
  if (f.getTime() >= hoy.getTime()) return 0
  let count = 0
  const cursor = new Date(f)
  cursor.setDate(cursor.getDate() + 1)
  while (cursor.getTime() <= hoy.getTime()) {
    const d = cursor.getDay()
    if (d !== 0 && d !== 6) count++
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}
