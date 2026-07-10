const variantClassNames = {
  archived: 'status-badge--archived',
  production: 'status-badge--production',
  staging: 'status-badge--staging',
};

function StatusBadge({ label, variant = 'staging' }) {
  const normalizedVariant = variant.toLowerCase();
  const variantClass =
    variantClassNames[normalizedVariant] ?? variantClassNames.staging;

  return <span className={`status-badge ${variantClass}`}>{label}</span>;
}

export default StatusBadge;
