const AdminStatusMessages = ({ error, status }) => (
  <>
    {error && <p className='admin-error'>{error}</p>}
    {status && <p className='admin-status'>{status}</p>}
  </>
);

export default AdminStatusMessages;
