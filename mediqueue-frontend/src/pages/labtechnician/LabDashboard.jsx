import { useState } from "react";
import PageLayout from "../../components/layout/PageLayout";
import PageTitle from "../../components/common/PageTitle";

export default function LabDashboard() {
  const [file, setFile] = useState(null);
  const [appointmentId, setAppointmentId] = useState("");
  const [reports, setReports] = useState([]);

  // ✅ FETCH REPORTS FOR APPOINTMENT
  const fetchReports = async () => {
    if (!appointmentId) {
      alert("Enter appointment ID");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8080/api/v1/lab/appointment/${appointmentId}`
      );
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ UPLOAD REPORT
  const handleUpload = async () => {
    if (!file || !appointmentId) {
      alert("Enter appointment ID + file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("appointmentId", appointmentId);

    try {
      const res = await fetch(
        "http://localhost:8080/api/v1/lab/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("Uploaded successfully");
        fetchReports(); // refresh list
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading");
    }
  };

  return (
    <PageLayout>
      <PageTitle title="Lab Dashboard" subtitle="Upload reports for appointments" />

      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          maxWidth: 700,
        }}
      >
        <h3>Upload Lab Report</h3>

        {/* ✅ APPOINTMENT INPUT */}
        <input
          type="text"
          placeholder="Enter Appointment ID"
          value={appointmentId}
          onChange={(e) => setAppointmentId(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

          <h3>Reports</h3>

{reports.length === 0 ? (
  <div
    style={{
      padding: 20,
      borderRadius: 10,
      background: "#fff5f7",
      border: "1px solid #f3c2cc",
      textAlign: "center",
      color: "#a9445b",
      marginTop: 10
    }}
  >
    <p style={{ fontWeight: 600, marginBottom: 6 }}>
      No Reports Found
    </p>
    <p style={{ fontSize: 14 }}>
      Upload a lab report for this appointment to see it here.
    </p>
  </div>
) : (
  reports.map((r) => (
    <div
      key={r.reportId}
      style={{
        padding: 12,
        border: "1px solid #eee",
        marginTop: 10,
        borderRadius: 8
      }}
    >
      <p><b>Report ID:</b> {r.reportId}</p>
      <a
        href={`http://localhost:8080/${r.filePath}`}
        target="_blank"
      >
        View Report
      </a>
    </div>
  ))
)}
      </div>
    </PageLayout>
  );
}