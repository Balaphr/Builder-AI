import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/components/auth-provider'
import { Toaster } from '@/components/ui/toast'
import { LandingPage } from '@/pages/landing'
import { LoginPage } from '@/pages/auth/login'
import { RegisterPage } from '@/pages/auth/register'
import { AuthCallback } from '@/pages/auth/callback'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardPage } from '@/pages/dashboard'
import { WebsitesPage } from '@/pages/dashboard/websites'
import { AIBuilderPage } from '@/pages/builder'
import { BuilderEditor } from '@/pages/builder/editor'
import { BuilderPreview } from '@/pages/builder/preview'
import { AIChatPage } from '@/pages/builder/chat'
import { TemplatesPage } from '@/pages/templates'
import { MediaPage } from '@/pages/media'
import { AnalyticsPage } from '@/pages/analytics'
import { DomainsPage } from '@/pages/domains'
import { AutomationPage } from '@/pages/automation'
import { TeamPage } from '@/pages/dashboard/team'
import { BillingPage } from '@/pages/billing'
import { SettingsPage } from '@/pages/settings'
import { BlogPage } from '@/pages/blog'
import { EcommercePage } from '@/pages/ecommerce'
import { AdminPage } from '@/pages/admin'
import { LoadingScreen } from '@/components/ui/loading'
import { PublicSitePage } from '@/pages/public/site'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/s/:slug" element={<PublicSitePage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="websites" element={<WebsitesPage />} />
        <Route path="builder" element={<AIBuilderPage />} />
        <Route path="builder/:id" element={<BuilderEditor />} />
        <Route path="builder/:id/preview" element={<BuilderPreview />} />
        <Route path="builder/:id/chat" element={<AIChatPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="domains" element={<DomainsPage />} />
        <Route path="automation" element={<AutomationPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="ecommerce" element={<EcommercePage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster />
    </AuthProvider>
  )
}
