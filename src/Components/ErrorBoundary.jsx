import { Component } from 'react'
import { logError } from '../services/errorService'
import '../Style/ErrorBoundary.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    logError(error, `ErrorBoundary | ${errorInfo.componentStack}`)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="ErrorBoundary_Container">
          <div className="ErrorBoundary_Emoji">️</div>
          <h1 className="ErrorBoundary_Title">
            Algo salió mal
          </h1>
          <p className="ErrorBoundary_Message">
            {this.state.error?.message || 'Ha ocurrido un error inesperado en la aplicación.'}
          </p>
          <button className="ErrorBoundary_Btn" onClick={this.handleRetry}>
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
