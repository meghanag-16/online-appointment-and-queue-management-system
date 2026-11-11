import { useEffect, useState } from "react";
import PageLayout from "../../components/layout/PageLayout";
import PageTitle from "../../components/common/PageTitle";
import { uploadLabReport, getAllLabReports } from "../../api/labApi";
import { errorMessage } from "../../api/axiosInstance";

export default function LabReports() {
  const [file, setFile] = useState(null);
  const [appointmentId, setAppointmentId] = useState("");
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await getAllLabReports();
      setReports(res.data);
    } catch (err) {
      setError(errorMessage(err, "Could not load reports."));
    }
  };

  // Previously this only logged to the console; it now uploads through the shared API client.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !appointmentId) { setError("Enter an appointment ID and choose a file."); return; }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("appointmentId", appointmentId.trim());
    setBusy(true); setError(""); setMessage("");
    try {
      await uploadLabReport(formData);
      setMessage("Report uploaded successfully.");
      setAppointmentId(""); setFile(null);
      e.target.reset();
      load();
    } catch (err) {
      setError(errorMessage(err, "Upload failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageLayout>
      <PageTitle title="Lab Reports" subtitle="Upload a report and see all uploaded reports" />
      <div className="card" style={{ maxWidth: 500, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Upload Report</h3>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="lr-appt">Appointment ID</label>
            <input id="lr-appt" className="form-control" placeholder="Enter Appointment ID"
              value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="lr-file">Upload File</label>
            <input id="lr-file" type="file" accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Uploading…" : "Upload Report"}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Report</th><th>Appointment</th><th>Patient</th><th>Type</th><th>Uploaded</th></tr></thead>
            <tbody>
              {reports.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--color-text-muted)" }}>No reports yet</td></tr>
              )}
              {reports.map(r => (
                <tr key={r.reportId}>
                  <td>#{r.reportId}</td><td>{r.appointmentId}</td><td>{r.patientId}</td>
                  <td>{r.reportType}</td>
                  <td>{r.uploadTime ? new Date(r.uploadTime).toLocaleString("en-IN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
