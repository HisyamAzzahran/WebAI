import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'animate.css';
import { useNavigate } from 'react-router-dom';
import { BarChart2, PlusCircle, RefreshCcw, Users, Database, Save } from 'lucide-react';

const API_URL = "https://webai-production-b975.up.railway.app";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ tokens: 0, is_premium: 0 });
  const [newUser, setNewUser] = useState({ email: '', username: '', password: '', tokens: 10, is_premium: 0 });
  const [featureStats, setFeatureStats] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchFeatureUsage();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/users`);
      setUsers(res.data);
    } catch {
      toast.error("❌ Gagal mengambil data user!");
    }
  };

  const fetchFeatureUsage = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/feature-usage`);
      setFeatureStats(res.data);
    } catch {
      toast.error("❌ Gagal mengambil data penggunaan fitur!");
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

  const addUser = async () => {
    if (!newUser.email || !newUser.username || !newUser.password) {
      toast.warning("⚠️ Mohon lengkapi semua data user!");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/admin/add-user`, newUser);
      if (res.data.message) {
        toast.success("✅ User baru ditambahkan!");
        setNewUser({ email: '', username: '', password: '', tokens: 10, is_premium: 0 });
        fetchUsers();
      }
    } catch {
      toast.error("❌ Gagal menambahkan user!");
    }
  };

  const saveDatabase = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/download-db`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'webai.db');
      document.body.appendChild(link);
      link.click();
      toast.success("💾 Database berhasil diunduh!");
    } catch {
      toast.error("❌ Gagal mengunduh database!");
    }
  };

  return (
    <div className="mt-6 px-4 animate__animated animate__fadeIn">
      <h2 className="text-2xl font-bold text-center text-blue-600">🎛️ Admin Dashboard</h2>

      <div className="flex justify-center flex-wrap gap-4 mt-6 mb-6">
        <button onClick={() => navigate("/admin/track-ikigai")} className="btn btn-outline-primary">
          <BarChart2 className="inline w-4 h-4 mr-1" /> Track Ikigai User
        </button>
        <button onClick={fetchUsers} className="btn btn-outline-success">
          <RefreshCcw className="inline w-4 h-4 mr-1" /> Refresh Data
        </button>
        <button onClick={saveDatabase} className="btn btn-outline-dark">
          <Save className="inline w-4 h-4 mr-1" /> Save Database
        </button>
      </div>

      <div className="card p-4 mb-4">
        <h5 className="mb-3 font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" /> Statistik Penggunaan Fitur
        </h5>
        <ul className="list-group list-group-flush">
          {featureStats.map((f, i) => (
            <li key={i} className="list-group-item d-flex justify-content-between">
              <span>{f.feature}</span>
              <span className="badge bg-primary-subtle text-primary-emphasis">{f.count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-4 mb-4">
        <h5 className="mb-3 font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" /> Data Pengguna
        </h5>
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead className="table-primary text-center">
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
                  <td className="text-center">{u.id}</td>
                  <td>{u.email}</td>
                  <td>{u.username}</td>
                  <td className="text-center">
                    <span className={`badge ${u.is_premium ? 'bg-success' : 'bg-secondary'}`}>
                      {u.is_premium ? 'Premium' : 'Basic'}
                    </span>
                  </td>
                  <td className="text-center">{u.tokens}</td>
                  <td className="text-center">
                    <button className="btn btn-outline-primary btn-sm me-1" onClick={() => startEdit(u)}>Edit</button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => deleteUser(u.email)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="card p-4 mb-4 animate__animated animate__fadeInUp">
          <h5 className="font-semibold mb-3">✏️ Edit User: <span className="text-primary">{editing}</span></h5>
          <input type="number" className="form-control mb-2" value={form.tokens} onChange={(e) => setForm({ ...form, tokens: Number(e.target.value) })} />
          <select className="form-select mb-3" value={form.is_premium} onChange={(e) => setForm({ ...form, is_premium: parseInt(e.target.value) })}>
            <option value="0">Basic</option>
            <option value="1">Premium</option>
          </select>
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-success me-2" onClick={updateUser}>💾 Simpan</button>
            <button className="btn btn-secondary" onClick={() => setEditing(null)}>❌ Batal</button>
          </div>
        </div>
      )}

      <div className="card p-4 mb-5 animate__animated animate__fadeInUp">
        <h5 className="font-semibold mb-3">
          <PlusCircle className="w-5 h-5 inline me-1" /> Tambah User Baru
        </h5>
        <input type="text" className="form-control mb-2" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
        <input type="text" className="form-control mb-2" placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
        <input type="password" className="form-control mb-2" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
        <input type="number" className="form-control mb-2" placeholder="Token" value={newUser.tokens} onChange={(e) => setNewUser({ ...newUser, tokens: Number(e.target.value) })} />
        <select className="form-select mb-3" value={newUser.is_premium} onChange={(e) => setNewUser({ ...newUser, is_premium: parseInt(e.target.value) })}>
          <option value="0">Basic</option>
          <option value="1">Premium</option>
        </select>
        <div className="d-flex justify-content-end">
          <button className="btn btn-primary" onClick={addUser}>➕ Tambah User</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;