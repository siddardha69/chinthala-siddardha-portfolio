const AdminHeader = ({ authState, onLogout }) => (
  <div className='admin-header'>
    <h1 className='admin-page-title'>Admin Dashboard</h1>
    {authState.isAuthenticated ? (
      <button type='button' className='admin-btn admin-btn-secondary' onClick={onLogout}>
        Logout ({authState.email})
      </button>
    ) : (
      <p className='admin-info'>Protected admin panel</p>
    )}
  </div>
);

export default AdminHeader;
