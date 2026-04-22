import { useState, useEffect } from "react";
import { getAllComplaints, resolveComplaint } from "../../api/complaintApi";

import PageLayout from "../../components/layout/PageLayout";
import PageTitle from "../../components/common/PageTitle";

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [resolution, setResolution] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await getAllComplaints();
      setComplaints(res.data);
    } catch {
      setComplaints([]);
    }
  };

  const handleResolve = async (complaintId) => {
    if (!resolution[complaintId]) {
      setError("Please enter a resolution note.");
      return;
    }

    try {
      await resolveComplaint(complaintId, resolution[complaintId]);
      setMessage("Complaint resolved successfully!");
      setError("");
      fetchComplaints();
    } catch {
      setError("Failed to resolve complaint.");
      setMessage("");
    }
  };

  const statusStyle = (status) => {
    if (status === "RESOLVED") return { color: "green", fontWeight: "bold" };
    if (status === "PENDING") return { color: "orange", fontWeight: "bold" };
    return {};
  };

  return (
    <PageLayout>
      <PageTitle
        title="Complaints Management"
        subtitle="Review and resolve patient complaints"
      />

      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        
        {message && (
          <p style={{ color: "green", marginBottom: "12px" }}>{message}</p>
        )}
        {error && (
          <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>
        )}

        {complaints.length === 0 ? (
          <div className="card">
            <p style={{ color: "var(--color-text-muted)" }}>
              No complaints found.
            </p>
          </div>
        ) : (
          complaints.map((complaint) => (
            <div key={complaint.id} className="card" style={{ marginBottom: "16px" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <strong>Complaint #{complaint.id}</strong>
                <span style={statusStyle(complaint.status)}>
                  {complaint.status}
                </span>
              </div>

              <p style={{ marginBottom: "12px" }}>
                {complaint.description}
              </p>

              {complaint.status !== "RESOLVED" && (
                <>
                  <input
                    type="text"
                    placeholder="Enter resolution note..."
                    value={resolution[complaint.id] || ""}
                    onChange={(e) =>
                      setResolution({
                        ...resolution,
                        [complaint.id]: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginBottom: "10px",
                    }}
                  />

                  <div style={{ textAlign: "right" }}>
                    <button
                      onClick={() => handleResolve(complaint.id)}
                      style={{
                        padding: "8px 16px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Mark as Resolved
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </PageLayout>
  );
}