'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { PageError } from './ui/PageError'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class PortalErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Portal render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <PageError
          message={this.state.error.message || 'Something went wrong loading this page.'}
          onRetry={() => this.setState({ error: null })}
        />
      )
    }
    return this.props.children
  }
}
