import { forwardRef, memo, useMemo, Fragment } from 'react';
import { ProjectData } from '../types';

interface Props {
  data: ProjectData;
}

export const ReportPreview = memo(forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const { projectInfo, photoEntries } = data;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '________________';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = year && month && day ? new Date(year, month - 1, day) : new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Keep page composition predictable for browser print/PDF engines.
  const pages = useMemo(() => {
    const result: { entries: typeof photoEntries; pageNum: number }[] = [];
    for (let i = 0; i < photoEntries.length; i += 2) {
      result.push({
        entries: photoEntries.slice(i, i + 2),
        pageNum: result.length + 1,
      });
    }
    return result;
  }, [photoEntries]);

  const totalPages = pages.length || 1;

  if (photoEntries.length === 0) {
    return (
      <div
        ref={ref}
        className="report-page"
        style={{
          width: '7.5in',
          margin: '0 auto',
          background: 'white',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ border: '2px solid black', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid black' }}>
            <div style={{ flex: 1, padding: '8px' }}>
              <h1 style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>
                {projectInfo.reportTitle || 'Photographic Log'}
              </h1>
            </div>
            <div
              style={{
                width: '80px',
                borderLeft: '2px solid black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                boxSizing: 'border-box',
              }}
            >
              {projectInfo.companyLogo ? (
                <img
                  src={projectInfo.companyLogo}
                  alt="Company Logo"
                  style={{ maxHeight: '32px', maxWidth: '72px', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontSize: '8px', color: '#9ca3af', textAlign: 'center' }}>Logo</span>
              )}
            </div>
          </div>
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
            No photos added yet. Upload photos to see the preview.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref}>
      {pages.map((page, pageIndex) => (
        <div
          key={`page-${pageIndex}`}
          className="report-page"
          style={{
            width: '7.5in',
            margin: '0 auto',
            background: 'white',
            boxSizing: 'border-box',
            pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
          }}
        >
          <div style={{ border: '2px solid black', boxSizing: 'border-box' }}>
            {/* Header - only on first page */}
            {pageIndex === 0 && (
              <>
                {/* Title and Logo Row */}
                <div style={{ display: 'flex', borderBottom: '2px solid black' }}>
                  <div style={{ flex: 1, padding: '6px 8px' }}>
                    <h1 style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>
                      {projectInfo.reportTitle || 'Photographic Log'}
                    </h1>
                  </div>
                  <div
                    style={{
                      width: '80px',
                      borderLeft: '2px solid black',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      boxSizing: 'border-box',
                    }}
                  >
                    {projectInfo.companyLogo ? (
                      <img
                        src={projectInfo.companyLogo}
                        alt="Company Logo"
                        style={{ maxHeight: '32px', maxWidth: '72px', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ fontSize: '8px', color: '#9ca3af', textAlign: 'center' }}>Logo</span>
                    )}
                  </div>
                </div>

                {/* Project and Job Number Row */}
                <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
                  <div style={{ flex: 1, borderRight: '1px solid black', padding: '4px 6px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 600 }}>Project:</div>
                    <div style={{ fontSize: '10px' }}>{projectInfo.projectName || '_______________'}</div>
                  </div>
                  <div style={{ flex: 1, padding: '4px 6px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 600 }}>Job Number:</div>
                    <div style={{ fontSize: '10px' }}>{projectInfo.jobNumber || '___________'}</div>
                  </div>
                </div>

                {/* Client and Location Row */}
                <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
                  <div style={{ flex: 1, borderRight: '1px solid black', padding: '4px 6px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 600 }}>Client:</div>
                    <div style={{ fontSize: '10px' }}>{projectInfo.clientName || '_______________'}</div>
                  </div>
                  <div style={{ flex: 1, padding: '4px 6px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 600 }}>Location:</div>
                    <div style={{ fontSize: '10px' }}>{projectInfo.location || '_______________'}</div>
                  </div>
                </div>

                {/* Date and Prepared By Row */}
                <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
                  <div style={{ flex: 1, borderRight: '1px solid black', padding: '4px 6px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 600 }}>Date:</div>
                    <div style={{ fontSize: '10px' }}>{formatDate(projectInfo.reportDate)}</div>
                  </div>
                  <div style={{ flex: 1, padding: '4px 6px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 600 }}>Prepared By:</div>
                    <div style={{ fontSize: '10px' }}>{projectInfo.preparedBy || '_______________'}</div>
                  </div>
                </div>
              </>
            )}

            {/* Photo Entries for this page */}
            {page.entries.map((entry, index) => (
              <Fragment key={entry.id}>
                <div className="photo-entry">
                  {/* Photo Metadata Row */}
                  <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
                    <div
                      style={{
                        width: '64px',
                        borderRight: '1px solid black',
                        padding: '3px 5px',
                        textAlign: 'center',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{ fontSize: '7.5px', fontWeight: 600 }}>Photo</div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold' }}>{entry.photographNo}</div>
                    </div>
                    <div style={{ flex: 1, borderRight: '1px solid black', padding: '3px 5px' }}>
                      <div style={{ fontSize: '7.5px', fontWeight: 600 }}>Date:</div>
                      <div style={{ fontSize: '9.5px' }}>{formatDate(entry.date)}</div>
                    </div>
                    <div style={{ flex: 1, padding: '3px 5px' }}>
                      <div style={{ fontSize: '7.5px', fontWeight: 600 }}>Direction:</div>
                      <div style={{ fontSize: '9.5px' }}>{entry.directionTaken || '___________'}</div>
                    </div>
                  </div>

                  {/* Description Row */}
                  <div style={{ borderBottom: '1px solid black', padding: '3px 5px' }}>
                    <div style={{ fontSize: '7.5px', fontWeight: 600, marginBottom: '1px' }}>Description:</div>
                    <div style={{ fontSize: '9.5px', lineHeight: '1.2' }}>
                      {entry.description || (
                        <span style={{ color: '#9ca3af' }}>No description</span>
                      )}
                    </div>
                  </div>

                  {/* Fixed report photo box; crop/position are applied only inside the clipped frame. */}
                  <div
                    style={{
                      padding: '3px',
                      background: '#f9fafb',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div className="report-photo-box">
                      <img
                        className="report-photo-image"
                        src={entry.image}
                        alt={`Photograph ${entry.photographNo}`}
                        style={{
                          objectPosition: `${entry.imageSettings.posX}% ${entry.imageSettings.posY}%`,
                          transform: `scale(${entry.imageSettings.zoom / 100}) rotate(${entry.imageSettings.rotation}deg)`,
                          transformOrigin: `${entry.imageSettings.posX}% ${entry.imageSettings.posY}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Separator between photos (except last in page) */}
                {index < page.entries.length - 1 && (
                  <div style={{ borderTop: '2px solid black' }} />
                )}
              </Fragment>
            ))}

            {/* Page Footer */}
            <div
              style={{
                borderTop: '1px solid black',
                padding: '3px',
                textAlign: 'center',
                fontSize: '8.5px',
                color: '#666',
              }}
            >
              Page {page.pageNum} of {totalPages}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}));

ReportPreview.displayName = 'ReportPreview';
