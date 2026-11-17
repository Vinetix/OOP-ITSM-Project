// Catches a crash anywhere below it and shows the crash screen instead of a
// blank page. (React only offers this as a class component.)
import { Component } from 'react'
import { CrashScreen } from './CrashScreen'

export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Unexpected error:', error, info.componentStack)
  }

  render() {
    return this.state.error ? <CrashScreen error={this.state.error} /> : this.props.children
  }
}
