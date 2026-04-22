import { useState } from "react";
import PageLayout from "../../components/layout/PageLayout";

export default function LabReports() {
  const [file, setFile] = useState(null);
  const [appointmentId, setAppointmentId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Uploading:", { appointmentId, file });
  };

  return (
    <PageLayout title="Upload Lab Report">
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h2 style={styles.heading}>Upload Report</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <label>Appointment ID</label>
            <input
              type="text"
              placeholder="Enter Appointment ID"
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
              style={styles.input}
            />

            <label>Upload File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              style={styles.input}
            />

            <button type="submit" style={styles.button}>
              Upload Report
            </button>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "flex-start",   // 👈 LEFT SIDE
    padding: "20px",
  },
  card: {
    width: "500px",
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",          // 👈 rounded corners
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  heading: {
    marginBottom: "15px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  button: {
    marginTop: "10px",
    padding: "10px",
    backgroundColor: "#e75480",   // 👈 SAME PINK
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};