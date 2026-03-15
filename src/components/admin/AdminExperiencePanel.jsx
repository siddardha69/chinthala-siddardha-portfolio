const AdminExperiencePanel = ({
  experienceForm,
  setExperienceForm,
  experienceLevelOptions,
  isExperienceSubmitting,
  onAddExperience,
  isExperienceLoading,
  experience,
  editingExperienceId,
  experienceEditForm,
  setExperienceEditForm,
  onSaveExperience,
  isSavingExperienceId,
  onCancelEditingExperience,
  onStartEditingExperience,
  isDeletingExperienceId,
  onRequestDeleteExperience,
  draggingExperienceId,
  dropTargetExperienceId,
  onExperienceDragStart,
  onExperienceDragOver,
  onExperienceDrop,
  onExperienceDragEnd
}) => (
  <section className='admin-experience-panel'>
    <h2 className='admin-title'>Experience Skills</h2>
    <p className='admin-info'>Add, edit, or remove skills. Changes reflect instantly in the Experience section.</p>

    <form className='admin-form admin-experience-form' onSubmit={onAddExperience}>
      <div className='admin-experience-form-row'>
        <select
          value={experienceForm.category}
          onChange={(event) => setExperienceForm((prev) => ({ ...prev, category: event.target.value }))}
        >
          <option value='frontend'>Frontend</option>
          <option value='backend'>Backend</option>
        </select>
        <input
          type='text'
          placeholder='Skill name'
          value={experienceForm.skill}
          onChange={(event) => setExperienceForm((prev) => ({ ...prev, skill: event.target.value }))}
        />
        <select
          value={experienceForm.level}
          onChange={(event) => setExperienceForm((prev) => ({ ...prev, level: event.target.value }))}
        >
          {experienceLevelOptions.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>
      <button className='admin-btn admin-btn-primary' type='submit' disabled={isExperienceSubmitting}>
        {isExperienceSubmitting ? 'Adding...' : 'Add Skill'}
      </button>
    </form>

    {isExperienceLoading ? (
      <p className='admin-info'>Loading experience skills...</p>
    ) : (
      <div className='admin-experience-columns'>
        {[
          { key: 'frontend', label: 'Frontend' },
          { key: 'backend', label: 'Backend' }
        ].map(({ key, label }) => (
          <div key={key} className='admin-experience-column'>
            <h3>{label} ({experience[key].length})</h3>
            {experience[key].length === 0 ? (
              <p className='admin-info'>No skills in this category.</p>
            ) : (
              <ul className='admin-experience-list'>
                {experience[key].map((item) => (
                  <li
                    key={item.id}
                    className={`admin-experience-item ${editingExperienceId === item.id ? 'is-editing' : ''} ${draggingExperienceId === item.id ? 'is-dragging' : ''} ${dropTargetExperienceId === item.id ? 'is-drop-target' : ''}`}
                    draggable={!editingExperienceId}
                    onDragStart={(event) => onExperienceDragStart(item.id, key, event)}
                    onDragOver={(event) => onExperienceDragOver(item.id, event)}
                    onDrop={(event) => onExperienceDrop(item.id, key, event)}
                    onDragEnd={onExperienceDragEnd}
                  >
                    {editingExperienceId === item.id ? (
                      <div className='admin-experience-edit'>
                        <div className='admin-experience-form-row'>
                          <select
                            value={experienceEditForm.category}
                            onChange={(event) => setExperienceEditForm((prev) => ({ ...prev, category: event.target.value }))}
                          >
                            <option value='frontend'>Frontend</option>
                            <option value='backend'>Backend</option>
                          </select>
                          <input
                            type='text'
                            value={experienceEditForm.skill}
                            onChange={(event) => setExperienceEditForm((prev) => ({ ...prev, skill: event.target.value }))}
                          />
                          <select
                            value={experienceEditForm.level}
                            onChange={(event) => setExperienceEditForm((prev) => ({ ...prev, level: event.target.value }))}
                          >
                            {experienceLevelOptions.map((level) => (
                              <option key={level} value={level}>{level}</option>
                            ))}
                          </select>
                        </div>
                        <div className='admin-project-actions'>
                          <button
                            type='button'
                            className='admin-btn admin-btn-primary'
                            onClick={() => onSaveExperience(item.id)}
                            disabled={isSavingExperienceId === item.id}
                          >
                            {isSavingExperienceId === item.id ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type='button'
                            className='admin-btn admin-btn-secondary'
                            onClick={onCancelEditingExperience}
                            disabled={isSavingExperienceId === item.id}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className='admin-experience-meta'>
                          <p className='admin-project-drag-label'>Drag to reorder</p>
                          <h4>{item.skill}</h4>
                          <p>{item.level}</p>
                        </div>
                        <div className='admin-project-actions'>
                          <button
                            type='button'
                            className='admin-btn admin-btn-secondary'
                            onClick={() => onStartEditingExperience(item, key)}
                            disabled={isDeletingExperienceId === item.id}
                          >
                            Edit
                          </button>
                          <button
                            type='button'
                            className='admin-btn admin-btn-danger'
                            onClick={() => onRequestDeleteExperience(item)}
                            disabled={isDeletingExperienceId === item.id}
                          >
                            {isDeletingExperienceId === item.id ? 'Removing...' : 'Remove'}
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

export default AdminExperiencePanel;
