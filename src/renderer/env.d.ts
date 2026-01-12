/// <reference types="vite/client" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<
        React.WebViewHTMLAttributes<HTMLWebViewElement>,
        HTMLWebViewElement
      >
    }
    interface Element extends React.ReactElement {}
  }
}

export {}
