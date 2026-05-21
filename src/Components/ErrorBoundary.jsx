import { Component } from 'react'
import { logError } from '../services/errorService'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    logError(error, 'ErrorBoundary')
    console.error('ErrorBoundary caught:', errorInfo.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          background: '#f8f9fa',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>️</div>
          <h1 style={{ color: '#333', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Algo salió mal
          </h1>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '400px' }}>
            {this.state.error?.message || 'Ha ocurrido un error inesperado en la aplicación.'}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              background: '#007832',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '9999px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
