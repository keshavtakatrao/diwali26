export default function MusicToggle({ isPlaying, onToggle }) {
  return (
    <button
      type="button"
      className={isPlaying ? 'music-toggle is-playing' : 'music-toggle'}
      aria-label={isPlaying ? 'Pause song' : 'Play song'}
      onClick={onToggle}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {isPlaying ? (
          <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
        ) : (
          <path d="M8 5v14l11-7z" />
        )}
      </svg>
    </button>
  )
}
