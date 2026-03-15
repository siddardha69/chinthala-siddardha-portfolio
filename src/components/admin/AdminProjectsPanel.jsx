const AdminProjectsPanel = ({
  form,
  setForm,
  editForm,
  setEditForm,
  isSubmitting,
  isDeletingId,
  isSavingId,
  editingId,
  isUploadingCreateImage,
  isUploadingEditImage,
  draggingId,
  dropTargetId,
  projects,
  isLoadingProjects,
  cloudinaryReady,
  onAddProject,
  onImageUpload,
  onProjectDragStart,
  onProjectDragEnter,
  onProjectDragOver,
  onProjectDrop,
  onProjectDragEnd,
  onSaveProject,
  onCancelEditing,
  onStartEditing,
  onRequestDeleteProject
}) => {
  const renderImageField = (mode, value, setValue, isUploading) => (
    <div className='admin-image-field'>
      <input
        type='url'
        placeholder='Image URL'
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className='admin-upload-row'>
        <label className={`admin-upload-btn ${!cloudinaryReady ? 'is-disabled' : ''}`}>
          <input
            type='file'
            accept='image/png,image/jpeg,image/webp,image/gif'
            disabled={!cloudinaryReady || isUploading}
            onChange={(event) => onImageUpload(event, mode)}
          />
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </label>
        {value && (
          <button type='button' className='admin-btn admin-btn-secondary' onClick={() => setValue('')}>
            Clear Image
          </button>
        )}
        <span className='admin-upload-note'>
          {cloudinaryReady
            ? 'PNG/JPG/WebP/GIF up to 1.5MB.'
            : 'Set REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_UPLOAD_PRESET to enable uploads.'}
        </span>
      </div>
      {value && (
        <div className='admin-image-preview'>
          <img src={value} alt='Project preview' loading='lazy' />
        </div>
      )}
    </div>
  );

  return (
    <div className='admin-content-grid'>
      <form className='admin-form' onSubmit={onAddProject}>
        <h2 className='admin-title'>Add Project</h2>
        <input type='text' placeholder='Project title' value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
        {renderImageField('create', form.image, (image) => setForm((prev) => ({ ...prev, image })), isUploadingCreateImage)}
        <input type='url' placeholder='GitHub URL' value={form.github} onChange={(event) => setForm((prev) => ({ ...prev, github: event.target.value }))} />
        <input type='url' placeholder='Live demo URL (optional)' value={form.demo} onChange={(event) => setForm((prev) => ({ ...prev, demo: event.target.value }))} />
        <input type='text' placeholder='Tags (comma separated)' value={form.tags} onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))} />
        <textarea placeholder='Short description' value={form.desc} onChange={(event) => setForm((prev) => ({ ...prev, desc: event.target.value }))} />

        <div className='admin-checkboxes'>
          <label><input type='checkbox' checked={form.isNew} onChange={(event) => setForm((prev) => ({ ...prev, isNew: event.target.checked }))} /> New</label>
          <label><input type='checkbox' checked={form.isFeatured} onChange={(event) => setForm((prev) => ({ ...prev, isFeatured: event.target.checked }))} /> Featured</label>
          <label><input type='checkbox' checked={form.isPopular} onChange={(event) => setForm((prev) => ({ ...prev, isPopular: event.target.checked }))} /> Popular</label>
        </div>

        <button className='admin-btn admin-btn-primary' type='submit' disabled={isSubmitting || isUploadingCreateImage}>
          {isSubmitting ? 'Adding...' : isUploadingCreateImage ? 'Uploading Image...' : 'Add Project'}
        </button>
      </form>

      <section className='admin-projects'>
        <h2 className='admin-title'>Projects ({projects.length})</h2>
        <p className='admin-info'>Drag and drop projects to reorder how they appear in the portfolio.</p>
        {isLoadingProjects ? (
          <p className='admin-info'>Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className='admin-info'>No projects yet. Add your first project using the form.</p>
        ) : (
          <ul>
            {projects.map((project) => (
              <li
                key={project.id}
                className={`admin-project-item ${editingId === project.id ? 'is-editing' : ''} ${draggingId === project.id ? 'is-dragging' : ''} ${dropTargetId === project.id ? 'is-drop-target' : ''}`}
                draggable={!editingId}
                onDragStart={(event) => onProjectDragStart(project.id, event)}
                onDragEnter={() => onProjectDragEnter(project.id)}
                onDragOver={(event) => onProjectDragOver(project.id, event)}
                onDrop={(event) => onProjectDrop(project.id, event)}
                onDragEnd={onProjectDragEnd}
              >
                {editingId === project.id ? (
                  <div className='admin-project-edit'>
                    <input
                      type='text'
                      placeholder='Project title'
                      value={editForm.title}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
                    />
                    {renderImageField('edit', editForm.image, (image) => setEditForm((prev) => ({ ...prev, image })), isUploadingEditImage)}
                    <input
                      type='url'
                      placeholder='GitHub URL'
                      value={editForm.github}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, github: event.target.value }))}
                    />
                    <input
                      type='url'
                      placeholder='Live demo URL (optional)'
                      value={editForm.demo}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, demo: event.target.value }))}
                    />
                    <input
                      type='text'
                      placeholder='Tags (comma separated)'
                      value={editForm.tags}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, tags: event.target.value }))}
                    />
                    <textarea
                      placeholder='Short description'
                      value={editForm.desc}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, desc: event.target.value }))}
                    />

                    <div className='admin-checkboxes'>
                      <label><input type='checkbox' checked={editForm.isNew} onChange={(event) => setEditForm((prev) => ({ ...prev, isNew: event.target.checked }))} /> New</label>
                      <label><input type='checkbox' checked={editForm.isFeatured} onChange={(event) => setEditForm((prev) => ({ ...prev, isFeatured: event.target.checked }))} /> Featured</label>
                      <label><input type='checkbox' checked={editForm.isPopular} onChange={(event) => setEditForm((prev) => ({ ...prev, isPopular: event.target.checked }))} /> Popular</label>
                    </div>

                    <div className='admin-project-actions'>
                      <button
                        type='button'
                        className='admin-btn admin-btn-primary'
                        onClick={() => onSaveProject(project.id)}
                        disabled={isSavingId === project.id || isUploadingEditImage}
                      >
                        {isSavingId === project.id ? 'Saving...' : isUploadingEditImage ? 'Uploading Image...' : 'Save'}
                      </button>
                      <button
                        type='button'
                        className='admin-btn admin-btn-secondary'
                        onClick={onCancelEditing}
                        disabled={isSavingId === project.id}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className='admin-project-meta'>
                      <p className='admin-project-drag-label'>Drag to reorder</p>
                      <h3>{project.title}</h3>
                      <p>{project.tags.join(', ')}</p>
                    </div>
                    <div className='admin-project-actions'>
                      <button
                        type='button'
                        className='admin-btn admin-btn-secondary'
                        onClick={() => onStartEditing(project)}
                        disabled={isDeletingId === project.id}
                      >
                        Edit
                      </button>
                      <button
                        type='button'
                        className='admin-btn admin-btn-danger'
                        onClick={() => onRequestDeleteProject(project)}
                        disabled={isDeletingId === project.id}
                      >
                        {isDeletingId === project.id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AdminProjectsPanel;
