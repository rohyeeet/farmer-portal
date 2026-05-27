import type { ReactNode } from 'react'
import RequireAuth from '../../routing/RequireAuth'
import RequireBootstrap from '../../routing/RequireBootstrap'
import { PortalErrorBoundary } from '../../components/PortalErrorBoundary'
import { PortalShellWrapper } from '../../components/shell/PortalShellWrapper'

export default function PortalRouteLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <RequireBootstrap>
        <PortalErrorBoundary>
          <PortalShellWrapper>{children}</PortalShellWrapper>
        </PortalErrorBoundary>
      </RequireBootstrap>
    </RequireAuth>
  )
}
