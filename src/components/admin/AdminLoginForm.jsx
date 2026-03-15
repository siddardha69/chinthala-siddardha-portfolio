const AdminLoginForm = ({
  authState,
  credentials,
  setCredentials,
  isSubmitting,
  onSubmit
}) => (
  <form className='admin-form admin-login-form' onSubmit={onSubmit}>
    <h2 className='admin-title'>Admin Login</h2>
    {!authState.isConfigured && (
      <p className='admin-info'>Set `REACT_APP_ADMIN_EMAIL` and `REACT_APP_ADMIN_PASSWORD_HASH` (SHA-256 hash or plain password) to enable login.</p>
    )}
    <input
      type='email'
      placeholder='Admin email'
      value={credentials.email}
      onChange={(event) => setCredentials((prev) => ({ ...prev, email: event.target.value }))}
      autoCapitalize='none'
      autoCorrect='off'
      spellCheck={false}
      required
    />
    <input
      type='password'
      placeholder='Password'
      value={credentials.password}
      onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
      autoCapitalize='none'
      autoCorrect='off'
      spellCheck={false}
      required
    />

    <button className='admin-btn admin-btn-primary' type='submit' disabled={isSubmitting || !authState.isConfigured}>
      {isSubmitting ? 'Signing in...' : 'Login'}
    </button>
  </form>
);

export default AdminLoginForm;
