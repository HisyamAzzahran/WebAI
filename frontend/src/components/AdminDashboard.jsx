import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'animate.css';

const API_URL = "https://c4339e7a-eefa-4bed-869b-93375b57f9e6-00-1si4rcqukplco.sisko.replit.dev";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ tokens: 0, is_premium: 0 });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/users`);
      setUsers(res.data);
    } catch {
      toast.error("❌ Gagal mengambil data user!");
    }
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
      toast.success("✅ User berhasil diupdate!");
      setEditing(null);
      fetchUsers();
    } catch {
      toast.error("❌ Gagal update user!");
    }
  };

  const deleteUser = async (email) => {
    if (confirm(`Yakin ingin menghapus user ${email}?`)) {
      try {
        await axios.post(`${API_URL}/admin/delete-user`, { email });
        toast.success("🗑️ User berhasil dihapus!");
        fetchUsers();
      } catch {
        toast.error("❌ Gagal menghapus user!");
      }
    }
  };

  return (
    <div className="mt-5 animate__animated animate__fadeIn">
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
              <td>
                <span className={`badge ${u.is_premium ? 'bg-success' : 'bg-secondary'}`}>
                  {u.is_premium ? 'Premium' : 'Basic'}
                </span>
              </td>
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
        <div className="card p-4 shadow mt-4 animate__animated animate__fadeInUp">
          <h5>Edit User: <span className="text-info">{editing}</span></h5>

          <input
            type="number"
            className="form-control mb-2"
            value={form.tokens}
            onChange={(e) => setForm({ ...form, tokens: Number(e.target.value) })}
            placeholder="Jumlah Token"
          />

          <select
            className="form-select mb-3"
            value={form.is_premium}
            onChange={(e) => setForm({ ...form, is_premium: parseInt(e.target.value) })}
          >
            <option value="0">Basic</option>
            <option value="1">Premium</option>
          </select>

          <div className="d-flex justify-content-end">
            <button className="btn btn-success me-2" onClick={updateUser}>💾 Simpan</button>
            <button className="btn btn-secondary" onClick={() => setEditing(null)}>❌ Batal</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
