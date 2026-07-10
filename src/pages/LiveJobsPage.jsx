import EmptyState from '../components/common/EmptyState';

function LiveJobsPage() {
  return (
    <section className="page-section">
      <p className="page-section__eyebrow">Operations</p>
      <h2 className="page-section__title">Live jobs</h2>
      <p className="page-section__subtitle">
        The dashboard shell is ready for future OTA job monitoring screens.
      </p>

      <div className="mt-4">
        <EmptyState
          title="Live jobs placeholder"
          description="Batch 1 keeps this page intentionally minimal while we stabilize the shared layout foundation."
        />
      </div>
    </section>
  );
}

export default LiveJobsPage;
