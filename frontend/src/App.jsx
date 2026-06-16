import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { GymConfigProvider } from './contexts/GymConfigContext'
import { ToastProvider } from './components/ui/Toast'

function App() {
  return (
    <BrowserRouter>
      <GymConfigProvider>
        <AppRoutes />
        <ToastProvider />
      </GymConfigProvider>
    </BrowserRouter>
  )
}

export default App
