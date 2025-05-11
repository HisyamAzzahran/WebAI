// components/TrackIkigai.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://webai-production-b975.up.railway.app";

const TrackIkigai = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/track-ikigai`);
      setData(res.data);
    } catch (err) {
      toast.error("❌ Gagal mengambil data track Ikigai.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="text-primary">📌 Riwayat Pemetaan Ikigai</h3>
        <button className="btn btn-outline-info" onClick={fetchData}>
          🔄 Refresh
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Nama</th>
              <th>MBTI</th>
              <th>3 VIA</th>
              <th>3 Career Role</th>
              <th>Ikigai Spot</th>
              <th>Slice of Life</th>
              <th>Waktu</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan="9" className="text-center">Belum ada data.</td></tr>
            ) : (
              data.map((d, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{d.email}</td>
                  <td>{d.nama}</td>
                  <td>{d.mbti}</td>
                  <td>{d.via?.join(', ')}</td>
                  <td>{d.career?.join(', ')}</td>
                  <td>{d.ikigai_spot}</td>
                  <td>{d.slice_purpose}</td>
                  <td>{new Date(d.timestamp).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrackIkigai;
