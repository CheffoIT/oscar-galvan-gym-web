import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { GymConfigProvider } from './contexts/GymConfigContext'

function App() {
  return (
    <BrowserRouter>
      <GymConfigProvider>
        <AppRoutes />
      </GymConfigProvider>
    </BrowserRouter>
  )
}

export default App
