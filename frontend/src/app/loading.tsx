export default function Loading() {
  return (
    <div className="loading-container" aria-live="polite" aria-busy="true">
      <div className="loading-spinner" />
      <span className="loading-text">Loading TEESGARAGE Archive...</span>
    </div>
  )
}
