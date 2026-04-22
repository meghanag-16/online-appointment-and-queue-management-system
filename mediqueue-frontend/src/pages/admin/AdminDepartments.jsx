import { useState, useEffect } from "react";
import { getAllDepartments, addDepartment } from "../../api/adminApi";
import PageLayout from "../../components/layout/PageLayout";
import PageTitle from "../../components/common/PageTitle";

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      const res = await getAllDepartments();
      setDepartments(res.data);
    } catch { setDepartments([]); }
  };

  const handleAdd = async () => {
    if (!name) { setError("Please enter a department name."); return; }
    try {
      // Backend expects "departmentName" field
      await addDepartment({ departmentName: name, description });
      setMessage("Department added successfully!");
      setError(""); setName(""); setDescription("");
      fetchDepartments();
    } catch {
      setError("Failed to add department."); setMessage("");
    }
  };

  return (
    <PageLayout>
      <PageTitle title="Departments Management" subtitle="Create and manage hospital departments" />
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {message && <p style={{ color: "green", marginBottom: "12px" }}>{message}</p>}
        {error   && <p style={{ color: "red",   marginBottom: "12px" }}>{error}</p>}

        <div className="card" style={{ marginBottom: "20px" }}>
          <h3 style={{ marginBottom: "16px" }}>Add New Department</h3>
          <input type="text" placeholder="Department Name *" value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }} />
          <input type="text" placeholder="Description (optional)" value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }} />
          <div style={{ textAlign: "right" }}>
            <button onClick={handleAdd}
              style={{ padding: "10px 16px", fontWeight: "bold", cursor: "pointer" }}>
              Add Department
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "16px" }}>All Departments</h3>
          {departments.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)" }}>No departments found.</p>
          ) : (
            departments.map((dept) => (
              <div key={dept.departmentId || dept.id}
                style={{ padding: "10px 0", borderBottom: "1px solid var(--color-border-tertiary)" }}>
                <strong>{dept.departmentName || dept.name}</strong>
              </div>
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
}
