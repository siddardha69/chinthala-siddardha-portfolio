const AdminConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className='admin-confirm-overlay' role='presentation' onClick={onCancel}>
      <div
        className='admin-confirm-dialog'
        role='dialog'
        aria-modal='true'
        aria-labelledby='admin-confirm-title'
        aria-describedby='admin-confirm-message'
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id='admin-confirm-title'>{title}</h3>
        <p id='admin-confirm-message'>{message}</p>
        <div className='admin-confirm-actions'>
          <button
            type='button'
            className='admin-btn admin-btn-secondary'
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type='button'
            className='admin-btn admin-btn-danger'
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfirmDialog;
