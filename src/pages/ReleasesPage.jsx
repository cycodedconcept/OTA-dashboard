import { useState } from 'react';
import { useSelector } from 'react-redux';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import UploadDropzone from '../components/common/UploadDropzone';

function ReleasesPage() {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const { items, searchTerm } = useSelector((state) => state.releases);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredReleases = items.filter((release) => {
    if (!normalizedSearchTerm) {
      return true;
    }

    return [release.version, release.target, release.channel].some((value) =>
      value.toLowerCase().includes(normalizedSearchTerm)
    );
  });

  const targetCount = new Set(items.map((release) => release.target)).size;

  return (
    <section className="page-section releases-page">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-3 gap-lg-4 mb-4">
        <div>
          <p className="page-section__eyebrow">Firmware</p>
          <h2 className="page-section__title">Releases</h2>
          <p className="page-section__subtitle">
            {items.length} builds stored across {targetCount} targets
          </p>
        </div>

        <button
          type="button"
          className="btn releases-page__upload-btn align-self-start"
          onClick={() => setIsBuilderOpen((currentValue) => !currentValue)}
        >
          {isBuilderOpen ? 'Hide upload form' : 'Upload firmware'}
        </button>
      </div>

      {isBuilderOpen ? (
        <div className="surface-card releases-builder-card mb-4">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-3 mb-3">
            <div>
              <h3 className="releases-builder-card__title">Add a build</h3>
              <p className="devices-form-card__subtitle">
                Upload the binary and manifest files only when you are ready to
                stage a new firmware package.
              </p>
            </div>

            <button
              type="button"
              className="btn releases-action-btn"
              onClick={() => setIsBuilderOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="row g-4">
            <div className="col-12 col-xl-6">
              <UploadDropzone label="Firmware binary (.bin)" />
            </div>

            <div className="col-12 col-xl-6">
              <UploadDropzone label="Manifest (.json)" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="surface-card releases-table-card">
        <div className="table-responsive">
          <table className="table releases-table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Version</th>
                <th scope="col">Target</th>
                <th scope="col">Channel</th>
                <th scope="col">Size</th>
                <th scope="col">Uploaded</th>
                <th scope="col" className="text-end">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredReleases.length > 0 ? (
                filteredReleases.map((release) => (
                  <tr key={release.id}>
                    <td className="releases-table__version">{release.version}</td>
                    <td className="releases-table__target">{release.target}</td>
                    <td>
                      <StatusBadge
                        label={release.channel}
                        variant={release.channel}
                      />
                    </td>
                    <td>{release.size}</td>
                    <td>{release.uploaded}</td>
                    <td className="text-end">
                      <div className="d-inline-flex flex-wrap justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-sm releases-action-btn"
                        >
                          Manifest
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm releases-action-btn"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm releases-action-btn releases-action-btn--deploy"
                        >
                          Deploy <i className="bi bi-chevron-down ms-1" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="releases-table__empty-cell">
                    <EmptyState
                      title="No releases match this search"
                      description="Try a version, target, or channel keyword to find the release you need."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default ReleasesPage;
