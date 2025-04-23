import { useEffect, useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/admin/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error('Gagal ambil data user', err));
  }, []);

  return (
    <div className="container mt-5">
      <h2 className="text-center">📊 Admin Dashboard</h2>
      <table className="table mt-4">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Username</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={i}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.is_premium ? 'Premium' : 'Basic'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
