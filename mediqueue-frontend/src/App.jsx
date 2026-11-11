import { AuthProvider } from './context/AuthContext'
import { ToastProvider, ConfirmProvider } from './components/ui'
import AppRouter from './routes/AppRouter'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AppRouter />
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
