const AdminToastContainer = ({ toasts, onDismiss }) => (
  <div className='admin-toast-stack' aria-live='polite' aria-atomic='true'>
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`admin-toast ${toast.type === 'error' ? 'is-error' : 'is-success'}`}
        role='status'
      >
        <span>{toast.message}</span>
        <button
          type='button'
          className='admin-toast-close'
          onClick={() => onDismiss(toast.id)}
          aria-label='Dismiss notification'
        >
          x
        </button>
      </div>
    ))}
  </div>
);

export default AdminToastContainer;
