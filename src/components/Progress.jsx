import './Progress.css';

export default function Progress({ text, percentage }) {
  percentage = percentage ?? 0;
  return (
    <div className="progress-container">
      <span className="progress-text">{text} ({`${percentage.toFixed(2)}%`})</span>
      <div className="progress-bar" style={{ 'width': `${percentage}%` }}>
        &nbsp;
      </div>
    </div>
  );
}
