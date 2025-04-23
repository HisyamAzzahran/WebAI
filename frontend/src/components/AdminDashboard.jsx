import { useState, useEffect } from 'react';
import axios from 'axios';
import 'animate.css';

// URL backend langsung
const API_URL = "https://6ea40469-1d71-4ae9-a062-fd248795b654-00-3j49ez9d9x36p.kirk.replit.dev";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/admin/users`)
      .then(res => setUsers(res.data))
      .catch(err => console.error('Gagal ambil data user:', err));
  }, []);

  return (
    <div className="mt-5 animate__animated animate__fadeInUp">
      <h2 className="text-center text-primary">📊 Admin Dashboard</h2>
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
              <td>
                <span className={`badge ${u.is_premium ? 'bg-success' : 'bg-secondary'}`}>
                  {u.is_premium ? 'Premium' : 'Basic'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
