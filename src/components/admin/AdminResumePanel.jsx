const AdminResumePanel = ({
  resume,
  isResumeDragOver,
  isUploadingResume,
  onDragOver,
  onDragLeave,
  onDrop,
  onInputChange,
  supabaseReady,
  maxResumeSizeMb
}) => (
  <section className='admin-resume-panel'>
    <h2 className='admin-title'>Resume</h2>
    <p className='admin-info'>Drag and drop a PDF resume. It updates the `Download CV` button in real time.</p>
    {resume?.url && (
      <a href={resume.url} target='_blank' rel='noreferrer' className='admin-resume-link'>
        Current: {resume.fileName || 'Resume.pdf'}
      </a>
    )}

    <div
      className={`admin-resume-dropzone ${isResumeDragOver ? 'is-active' : ''} ${isUploadingResume ? 'is-uploading' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <p>{isUploadingResume ? 'Uploading resume to Supabase...' : 'Drop PDF here'}</p>
      <span>or</span>
      <label className={`admin-upload-btn ${!supabaseReady || isUploadingResume ? 'is-disabled' : ''}`}>
        <input
          type='file'
          accept='application/pdf'
          disabled={!supabaseReady || isUploadingResume}
          onChange={onInputChange}
        />
        {isUploadingResume ? 'Uploading...' : 'Choose PDF'}
      </label>
      <small>
        {supabaseReady
          ? `Only PDF up to ${maxResumeSizeMb}MB.`
          : 'Set REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY and REACT_APP_SUPABASE_RESUME_BUCKET to enable resume uploads.'}
      </small>
    </div>
  </section>
);

export default AdminResumePanel;
