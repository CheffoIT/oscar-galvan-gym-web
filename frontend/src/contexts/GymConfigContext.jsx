import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getConfiguracion } from '../services/api'

const GymConfigContext = createContext(null)

export function GymConfigProvider({ children }) {
  const [config, setConfig] = useState({ logo_url: null, nombre: 'OSCAR GALVAN GYM' })

  const loadConfig = useCallback(async () => {
    const { data } = await getConfiguracion()
    if (data) setConfig(prev => ({ ...prev, ...data }))
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  return (
    <GymConfigContext.Provider value={{ config, reload: loadConfig }}>
      {children}
    </GymConfigContext.Provider>
  )
}

export const useGymConfig = () => useContext(GymConfigContext)
