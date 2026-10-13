import { Navigate } from 'react-router-dom'

/** Legacy dashboard section — Super Admin console lives at /admin */
export default function SuperAdminPanel() {
  return <Navigate to="/admin/dashboard" replace />
}
