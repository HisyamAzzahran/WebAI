import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "https://6ea40469-1d71-4ae9-a062-fd248795b654-00-3j49ez9d9x36p.kirk.replit.dev";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ tokens: 0, is_premium: 0 });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await axios.get(`${API_URL}/admin/users`);
    setUsers(res.data);
  };

  const startEdit = (user) => {
    setEditing(user.email);
    setForm({ tokens: user.tokens, is_premium: user.is_premium });
  };

  const updateUser = async () => {
    try {
      await axios.post(`${API_URL}/admin/update-user`, {
        email: editing,
        tokens: Number(form.tokens),
        is_premium: parseInt(form.is_premium)
      });
      alert("User berhasil diupdate!");
      setEditing(null);
      fetchUsers();
    } catch {
      alert("Gagal update user!");
    }
  };

  const deleteUser = async (email) => {
    if (confirm(`Yakin ingin menghapus user ${email}?`)) {
      try {
        await axios.post(`${API_URL}/admin/delete-user`, { email });
        alert("User berhasil dihapus!");
        fetchUsers();
      } catch {
        alert("Gagal hapus user!");
      }
    }
  };

  return (
    <div className="mt-5">
      <h2 className="text-center text-primary">📊 Admin Dashboard</h2>
      <table className="table mt-4">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Email</th>
            <th>Username</th>
            <th>Status</th>
            <th>Token</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={i}>
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td>{u.username}</td>
              <td>{u.is_premium ? "Premium" : "Basic"}</td>
              <td>{u.tokens}</td>
              <td>
                <button className="btn btn-sm btn-outline-info me-2" onClick={() => startEdit(u)}>Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteUser(u.email)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <div className="card p-3 shadow mt-4">
          <h5>Edit User: {editing}</h5>
          <input
            type="number"
            className="form-control mb-2"
            value={form.tokens}
            onChange={(e) => setForm({ ...form, tokens: Number(e.target.value) })}
            placeholder="Token"
          />
          <select
            className="form-select mb-2"
            value={form.is_premium}
            onChange={(e) => setForm({ ...form, is_premium: parseInt(e.target.value) })}
          >
            <option value="0">Basic</option>
            <option value="1">Premium</option>
          </select>
          <button className="btn btn-success me-2" onClick={updateUser}>Simpan</button>
          <button className="btn btn-secondary" onClick={() => setEditing(null)}>Batal</button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
