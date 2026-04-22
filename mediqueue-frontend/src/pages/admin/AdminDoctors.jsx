import { useState, useEffect } from "react";
import { getAllDoctors, onboardDoctor, deactivateDoctor } from "../../api/adminApi";
import PageLayout from "../../components/layout/PageLayout";
import PageTitle from "../../components/common/PageTitle";

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [qualification, setQualification] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    try {
      const res = await getAllDoctors();
      setDoctors(res.data);
    } catch {
      setDoctors([]);
    }
  };

  const handleOnboard = async () => {
    if (!name || !email || !specialization) {
      setError("Please fill in all required fields (Name, Email, Specialization).");
      return;
    }
    try {
      await onboardDoctor({ name, email, specialization, qualification, consultationFee });
      setMessage("Doctor onboarded successfully!");
      setError("");
      setName(""); setEmail(""); setSpecialization("");
      setQualification(""); setConsultationFee("");
      fetchDoctors();
    } catch {
      setError("Failed to onboard doctor.");
      setMessage("");
    }
  };

  const handleDeactivate = async (doctorId) => {
    try {
      await deactivateDoctor(doctorId);
      setMessage("Doctor deactivated.");
      fetchDoctors();
    } catch {
      setError("Failed to deactivate doctor.");
    }
  };

  return (
    <PageLayout>
      <PageTitle title="Doctors Management" subtitle="Onboard and manage doctors" />
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {message && <p style={{ color: "green", marginBottom: "12px" }}>{message}</p>}
        {error   && <p style={{ color: "red",   marginBottom: "12px" }}>{error}</p>}

        <div className="card" style={{ marginBottom: "20px" }}>
          <h3 style={{ marginBottom: "16px" }}>Onboard New Doctor</h3>

          <input type="text" placeholder="Full Name *" value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }} />

          <input type="email" placeholder="Email *" value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }} />

          <input type="text" placeholder="Specialization *" value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }} />

          <input type="text" placeholder="Qualification (e.g. MBBS, MD)" value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }} />

          <input type="number" placeholder="Consultation Fee (₹)" value={consultationFee}
            onChange={(e) => setConsultationFee(e.target.value)}
            min="0" step="0.01"
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }} />

          <div style={{ textAlign: "right" }}>
            <button onClick={handleOnboard}
              style={{ padding: "10px 16px", fontWeight: "bold", cursor: "pointer" }}>
              Onboard Doctor
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "16px" }}>All Doctors</h3>
          {doctors.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)" }}>No doctors found.</p>
          ) : (
            doctors.map((doc) => {
              const doctorId = doc.userId || doc.id;
              return (
                <div key={doctorId} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0", borderBottom: "1px solid var(--color-border-tertiary)",
                }}>
                  <div>
                    <strong>{doc.name || doc.username}</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "13px" }}>
                      {doc.specialization || "Doctor"} | {doc.email}
                    </p>
                    {doc.qualification && (
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>
                        🎓 {doc.qualification}
                      </p>
                    )}
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>
                      💰 Consultation Fee: ₹{doc.consultationFee ?? 0}
                    </p>
                  </div>
                  <button onClick={() => handleDeactivate(doctorId)}
                    style={{ padding: "6px 12px", cursor: "pointer", fontWeight: "bold" }}>
                    Deactivate
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PageLayout>
  );
}
