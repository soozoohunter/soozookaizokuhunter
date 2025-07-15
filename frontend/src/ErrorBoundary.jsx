import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: 'white', backgroundColor: '#1e1e1e' }}>
          <h2>\u767c\u751f\u932f\u8aa4</h2>
          <p>\u8acb\u5237\u65b0\u9801\u9762\u6216\u7a0d\u5f8c\u518d\u8a66\u3002</p>
          <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo?.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
