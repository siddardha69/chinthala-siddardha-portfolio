const AdminQualificationPanel = ({
  qualificationForm,
  setQualificationForm,
  isQualificationSubmitting,
  onAddQualification,
  isQualificationLoading,
  qualification,
  editingQualificationId,
  qualificationEditForm,
  setQualificationEditForm,
  onSaveQualification,
  isSavingQualificationId,
  onCancelEditingQualification,
  onStartEditingQualification,
  isDeletingQualificationId,
  onRequestDeleteQualification
}) => (
  <section className='admin-qualification-panel'>
    <h2 className='admin-title'>Qualification Timeline</h2>
    <p className='admin-info'>Manage education and experience timeline entries shown in the Qualification section.</p>

    <form className='admin-form admin-qualification-form' onSubmit={onAddQualification}>
      <div className='admin-qualification-form-row'>
        <select
          value={qualificationForm.category}
          onChange={(event) => setQualificationForm((prev) => ({ ...prev, category: event.target.value }))}
        >
          <option value='education'>Education</option>
          <option value='experience'>Experience</option>
        </select>
        <input
          type='text'
          placeholder='Title'
          value={qualificationForm.title}
          onChange={(event) => setQualificationForm((prev) => ({ ...prev, title: event.target.value }))}
        />
        <input
          type='text'
          placeholder='Subtitle'
          value={qualificationForm.subtitle}
          onChange={(event) => setQualificationForm((prev) => ({ ...prev, subtitle: event.target.value }))}
        />
        <input
          type='text'
          placeholder='Period (e.g. 2022 - 2026)'
          value={qualificationForm.period}
          onChange={(event) => setQualificationForm((prev) => ({ ...prev, period: event.target.value }))}
        />
      </div>
      <button className='admin-btn admin-btn-primary' type='submit' disabled={isQualificationSubmitting}>
        {isQualificationSubmitting ? 'Adding...' : 'Add Entry'}
      </button>
    </form>

    {isQualificationLoading ? (
      <p className='admin-info'>Loading qualification entries...</p>
    ) : (
      <div className='admin-qualification-columns'>
        {[
          { key: 'education', label: 'Education' },
          { key: 'experience', label: 'Experience' }
        ].map(({ key, label }) => (
          <div key={key} className='admin-qualification-column'>
            <h3>{label} ({qualification[key].length})</h3>
            {qualification[key].length === 0 ? (
              <p className='admin-info'>No entries in this category.</p>
            ) : (
              <ul className='admin-qualification-list'>
                {qualification[key].map((item) => (
                  <li key={item.id} className='admin-qualification-item'>
                    {editingQualificationId === item.id ? (
                      <div className='admin-qualification-edit'>
                        <div className='admin-qualification-form-row'>
                          <select
                            value={qualificationEditForm.category}
                            onChange={(event) => setQualificationEditForm((prev) => ({ ...prev, category: event.target.value }))}
                          >
                            <option value='education'>Education</option>
                            <option value='experience'>Experience</option>
                          </select>
                          <input
                            type='text'
                            value={qualificationEditForm.title}
                            onChange={(event) => setQualificationEditForm((prev) => ({ ...prev, title: event.target.value }))}
                          />
                          <input
                            type='text'
                            value={qualificationEditForm.subtitle}
                            onChange={(event) => setQualificationEditForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                          />
                          <input
                            type='text'
                            value={qualificationEditForm.period}
                            onChange={(event) => setQualificationEditForm((prev) => ({ ...prev, period: event.target.value }))}
                          />
                        </div>
                        <div className='admin-project-actions'>
                          <button
                            type='button'
                            className='admin-btn admin-btn-primary'
                            onClick={() => onSaveQualification(item.id)}
                            disabled={isSavingQualificationId === item.id}
                          >
                            {isSavingQualificationId === item.id ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type='button'
                            className='admin-btn admin-btn-secondary'
                            onClick={onCancelEditingQualification}
                            disabled={isSavingQualificationId === item.id}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className='admin-qualification-meta'>
                          <h4>{item.title}</h4>
                          <p>{item.subtitle}</p>
                          <small>{item.period}</small>
                        </div>
                        <div className='admin-project-actions'>
                          <button
                            type='button'
                            className='admin-btn admin-btn-secondary'
                            onClick={() => onStartEditingQualification(item, key)}
                            disabled={isDeletingQualificationId === item.id}
                          >
                            Edit
                          </button>
                          <button
                            type='button'
                            className='admin-btn admin-btn-danger'
                            onClick={() => onRequestDeleteQualification(item)}
                            disabled={isDeletingQualificationId === item.id}
                          >
                            {isDeletingQualificationId === item.id ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    )}
  </section>
);

export default AdminQualificationPanel;
