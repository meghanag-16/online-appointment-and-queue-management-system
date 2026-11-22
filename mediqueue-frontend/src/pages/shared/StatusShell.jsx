import { useAuth } from '../../context/AuthContext'
import PageLayout from '../../components/layout/PageLayout'
import PublicLayout from '../../components/layout/PublicLayout'

/** Signed-in people keep their app header and menu on status pages; visitors get the public header. */
export default function StatusShell({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <PageLayout>{children}</PageLayout> : <PublicLayout>{children}</PublicLayout>
}
