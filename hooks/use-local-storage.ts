"use client"

import { useState, useEffect } from "react"

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Estado para almacenar nuestro valor
  // Pasar la función de inicialización a useState para que solo se ejecute una vez
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }
    try {
      // Obtener del localStorage por clave
      const item = window.localStorage.getItem(key)
      // Analizar el JSON almacenado o si no existe devolver initialValue
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // Si hay un error, devolver initialValue
      console.error("Error reading from localStorage:", error)
      return initialValue
    }
  })

  // Devolver una versión envuelta de la función setter de useState que persiste el nuevo valor en localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir que el valor sea una función para que tengamos la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      // Guardar el estado
      setStoredValue(valueToStore)
      // Guardar en localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      // Un error más descriptivo
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  // Efecto para actualizar el localStorage cuando la clave cambia
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue))
      } catch (error) {
        console.error(`Error updating localStorage key "${key}" after key change:`, error)
      }
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}
