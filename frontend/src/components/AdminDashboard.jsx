import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'animate.css';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart2, PlusCircle, RefreshCcw, Users, Database } from 'lucide-react';

const API_URL = "https://webai-production-b975.up.railway.app";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ tokens: 0, is_premium: 0 });
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    password: '', // Tambahan
    tokens: 10,
    is_premium: 0
  });
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

  return (
    <div className="mt-6 px-4 animate__animated animate__fadeIn">
      <h2 className="text-2xl font-bold text-center text-blue-600">🎛️ Admin Dashboard</h2>

      <div className="flex justify-center gap-4 mt-6 mb-6">
        <Button onClick={() => navigate("/admin/track-ikigai")} variant="outline">
          <BarChart2 className="mr-2 h-4 w-4" /> Track Ikigai User
        </Button>
        <Button onClick={fetchUsers} variant="outline">
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh Data
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <h5 className="text-lg font-semibold mb-3 flex items-center gap-2"><Database className="w-5 h-5" /> Statistik Penggunaan Fitur</h5>
          <ul className="space-y-2">
            {featureStats.map((f, i) => (
              <li key={i} className="flex justify-between border-b pb-1">
                <span>{f.feature}</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">{f.count}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4">
          <h5 className="text-lg font-semibold mb-3 flex items-center gap-2"><Users className="w-5 h-5" /> Data Pengguna</h5>
          <table className="table-auto w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-2 py-1">#</th>
                <th className="px-2 py-1 text-left">Email</th>
                <th className="px-2 py-1 text-left">Username</th>
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1">Token</th>
                <th className="px-2 py-1">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-t">
                  <td className="text-center px-2 py-1">{u.id}</td>
                  <td className="px-2 py-1">{u.email}</td>
                  <td className="px-2 py-1">{u.username}</td>
                  <td className="text-center px-2 py-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${u.is_premium ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {u.is_premium ? 'Premium' : 'Basic'}
                    </span>
                  </td>
                  <td className="text-center px-2 py-1">{u.tokens}</td>
                  <td className="text-center px-2 py-1">
                    <Button size="sm" variant="outline" className="mr-2" onClick={() => startEdit(u)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteUser(u.email)}>Hapus</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {editing && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h5 className="font-semibold mb-3">✏️ Edit User: <span className="text-blue-600">{editing}</span></h5>
            <input
              type="number"
              className="form-input w-full mb-2"
              value={form.tokens}
              onChange={(e) => setForm({ ...form, tokens: Number(e.target.value) })}
              placeholder="Jumlah Token"
            />
            <select
              className="form-select w-full mb-3"
              value={form.is_premium}
              onChange={(e) => setForm({ ...form, is_premium: parseInt(e.target.value) })}
            >
              <option value="0">Basic</option>
              <option value="1">Premium</option>
            </select>
            <div className="flex justify-end gap-2">
              <Button onClick={updateUser}>💾 Simpan</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>❌ Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardContent className="p-4">
          <h5 className="font-semibold mb-3"><PlusCircle className="w-5 h-5 inline mr-2" /> Tambah User Baru</h5>
          <input
            type="text"
            className="form-input w-full mb-2"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <input
            type="text"
            className="form-input w-full mb-2"
            placeholder="Username"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          />
          <input
            type="password"
            className="form-input w-full mb-2"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
          <input
            type="number"
            className="form-input w-full mb-2"
            placeholder="Token"
            value={newUser.tokens}
            onChange={(e) => setNewUser({ ...newUser, tokens: Number(e.target.value) })}
          />
          <select
            className="form-select w-full mb-3"
            value={newUser.is_premium}
            onChange={(e) => setNewUser({ ...newUser, is_premium: parseInt(e.target.value) })}
          >
            <option value="0">Basic</option>
            <option value="1">Premium</option>
          </select>
          <div className="flex justify-end">
            <Button onClick={addUser}>➕ Tambah User</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
