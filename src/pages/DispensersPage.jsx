import EmptyState from '../components/common/EmptyState';

function DispensersPage() {
  return (
    <section className="page-section">
      <p className="page-section__eyebrow">Hardware</p>
      <h2 className="page-section__title">Dispensers</h2>
      <p className="page-section__subtitle">
        Navigation and reusable layout pieces are ready for dispenser management.
      </p>

      <div className="mt-4">
        <EmptyState
          title="Dispensers placeholder"
          description="Detailed hardware target management will be added in a later batch."
        />
      </div>
    </section>
  );
}

export default DispensersPage;
