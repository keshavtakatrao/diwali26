export default function LightSwitch({ isOn, swingKey, onPress }) {
  return (
    <button type="button" className="switch" onClick={onPress}>
      {/* Remounting on each press replays the cord's swing. */}
      <span key={swingKey} className="switch-cord" aria-hidden="true" />
      <span className="switch-base">
        <span className="switch-face">
          <span className="switch-small">{isOn ? 'Change' : 'Turn on'}</span>
          <span className="switch-big">Lights</span>
        </span>
      </span>
    </button>
  )
}
