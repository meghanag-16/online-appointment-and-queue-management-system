import { useState } from "react";
import PageLayout from "../../components/layout/PageLayout";
import { raiseComplaint } from "../../api/complaintApi";

export default function PatientComplaints() {
  const [appointmentId, setAppointmentId] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await raiseComplaint({
        appointmentId,
        issueType,
        description,
      });

      alert("Complaint submitted successfully");

      setAppointmentId("");
      setIssueType("");
      setDescription("");
    } catch (error) {
      console.error(error);
      alert("Error submitting complaint");
    }
  };

  return (
    <PageLayout title="">
      <div style={styles.wrapper}>
        
        {/* 🔥 TITLE OUTSIDE CARD */}
        <h1 style={styles.title}>Raise Complaint</h1>
        <p style={styles.subtitle}>
          Submit an issue regarding your appointment or service
        </p>

        {/* 🔥 FORM CARD */}
        <div style={styles.card}>
          <form onSubmit={handleSubmit} style={styles.form}>
            
            <label>Appointment ID (optional)</label>
            <input
              type="text"
              placeholder="Enter Appointment ID"
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
              style={styles.input}
            />

            <label>Issue Type *</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              required
              style={styles.input}
            >
              <option value="">Select Issue Type</option>
              <option value="Doctor Delay">Doctor Delay</option>
              <option value="Wrong Billing">Wrong Billing</option>
              <option value="Lab Issue">Lab Issue</option>
              <option value="Other">Other</option>
            </select>

            <label>Description *</label>
            <textarea
              placeholder="Describe your complaint..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={styles.textarea}
            />

            <button type="submit" style={styles.button}>
              Submit Complaint
            </button>
          </form>
        </div>

      </div>
    </PageLayout>
  );
}

const styles = {
  wrapper: {
    padding: "20px 30px",
  },

  // 🔥 EXACT TYPOGRAPHY MATCH
  title: {
    fontSize: "32px",
    fontWeight: "700",
    fontFamily: "serif",
    marginBottom: "5px",
  },

  subtitle: {
    color: "#777",
    marginBottom: "20px",
  },

  // 🔥 CARD SAME AS BOOK SLOT
  card: {
    width: "500px",
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },

  textarea: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    minHeight: "90px",
  },

  button: {
    marginTop: "10px",
    padding: "12px",
    backgroundColor: "#e75480",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
  },
};