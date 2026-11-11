import { useState, useEffect } from "react";
import { getAllDoctors, onboardDoctor, deactivateDoctor } from "../../api/adminApi";
import { errorMessage } from "../../api/axiosInstance";
import PageLayout from "../../components/layout/PageLayout";
import PageTitle from "../../components/common/PageTitle";
import StatusBadge from "../../components/common/StatusBadge";
import UserProfileForm from "../../components/forms/UserProfileForm";

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    try {
      const res = await getAllDoctors();
      setDoctors(res.data);
    } catch (err) {
      setDoctors([]);
      setError(errorMessage(err, "Could not load doctors."));
    }
  };

  // Same form and same backend fields as doctor self-registration (no hard-coded password).
  const handleOnboard = async (payload) => {
    setMessage(""); setError("");
    const res = await onboardDoctor(payload);
    setMessage(`Dr. ${res.data.name} onboarded. They can log in as "${res.data.username}" with the password you set.`);
    fetchDoctors();
  };

  const handleDeactivate = async (doctorId) => {
    if (!window.confirm("Deactivate this doctor? They will no longer be able to log in.")) return;
    try {
      await deactivateDoctor(doctorId);
      setMessage("Doctor deactivated.");
      setError("");
      fetchDoctors();
    } catch (err) {
      setError(errorMessage(err, "Failed to deactivate doctor."));
    }
  };

  return (
    <PageLayout>
      <PageTitle title="Doctors Management" subtitle="Onboard and manage doctors" />
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {message && <div className="alert alert-success">{message}</div>}
        {error   && <div className="alert alert-error">{error}</div>}

        <div className="card" style={{ marginBottom: "20px" }}>
          <h3 style={{ marginBottom: "16px" }}>Onboard New Doctor</h3>
          <UserProfileForm
            fixedRole="DOCTOR"
            submitLabel="Onboard Doctor"
            passwordLabel="Initial Password"
            passwordHint="Min. 8 characters — share it with the doctor"
            resetOnSuccess
            onSubmit={handleOnboard}
          />
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
                  padding: "12px 0", borderBottom: "1px solid var(--color-border)",
                }}>
                  <div>
                    <strong>{doc.name || doc.username}</strong>{" "}
                    {doc.accountStatus && <StatusBadge status={doc.accountStatus} />}
                    <p style={{ margin: "2px 0 0", fontSize: "13px" }}>
                      {doc.specialization || "Doctor"}
                      {doc.departmentName ? ` · ${doc.departmentName}` : ""} | {doc.email}
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
                  {doc.accountStatus !== "DEACTIVATED" && (
                    <button className="btn btn-outline btn-sm" onClick={() => handleDeactivate(doctorId)}>
                      Deactivate
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </PageLayout>
  );
}
