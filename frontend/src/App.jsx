import { useState } from 'react';
import axios from 'axios';
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import EssayGenerator from "./components/EssayGenerator";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);

  useState(() => {
    axios.get('http://localhost:5000/admin/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error('Gagal ambil data user:', err));
  }, []);

  return (
    <div className="mt-5">
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

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');

  return (
    <div className="container mt-4">
      <h1 className="text-center text-primary fw-bold">🎓 Web AI Essay Generator</h1>

      {!isLoggedIn ? (
        <>
          <LoginForm onLogin={(premium, email, admin) => {
            setIsLoggedIn(true);
            setIsPremium(premium);
            setEmail(email);
            setIsAdmin(admin);
          }} />
          <RegisterForm />
        </>
      ) : (
        isAdmin ? (
          <AdminDashboard />
        ) : (
          <>
            <EssayGenerator isPremium={isPremium} email={email} />
            {!isPremium && (
              <div className="alert alert-warning mt-4 text-center">
                Kamu user basic. Untuk akses semua sub-tema, upgrade ke premium!
                <br />
                <a
                  href="https://wa.me/6282211929271"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-success mt-2"
                >
                  Upgrade ke Premium
                </a>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
};

export default App;
