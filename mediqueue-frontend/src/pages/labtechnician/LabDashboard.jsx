import { useState } from "react";
import PageLayout from "../../components/layout/PageLayout";
import PageTitle from "../../components/common/PageTitle";
import { uploadLabReport, getLabReportsByAppointment } from "../../api/labApi";
import { errorMessage } from "../../api/axiosInstance";

// Uses the shared API client (token attached, real error messages) instead of raw fetch()
// calls to http://localhost:8080, which were rejected because they sent no login token.
export default function LabDashboard() {
  const [file, setFile] = useState(null);
  const [appointmentId, setAppointmentId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchReports = async (id = appointmentId) => {
    if (!id) { setError("Enter an appointment ID."); return; }
    setError("");
    try {
      const res = await getLabReportsByAppointment(id.trim());
      setReports(res.data);
    } catch (err) {
      setReports([]);
      setError(errorMessage(err, "Could not load reports."));
    }
  };

  const handleUpload = async () => {
    if (!file || !appointmentId) { setError("Enter an appointment ID and choose a file."); return; }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("appointmentId", appointmentId.trim());
    if (remarks) formData.append("remarks", remarks);

    setBusy(true); setError(""); setMessage("");
    try {
      await uploadLabReport(formData);
      setMessage("Report uploaded successfully.");
      setFile(null); setRemarks("");
      fetchReports();
    } catch (err) {
      setError(errorMessage(err, "Upload failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageLayout>
      <PageTitle title="Lab Dashboard" subtitle="Upload reports for appointments" />

      <div className="card" style={{ maxWidth: 700 }}>
        <h3 style={{ marginBottom: 12 }}>Upload Lab Report</h3>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="lab-appt">Appointment ID</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input id="lab-appt" className="form-control" style={{ flex: 1 }}
              placeholder="Enter Appointment ID" value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)} />
            <button type="button" className="btn btn-outline" onClick={() => fetchReports()}>
              Show Reports
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="lab-file">Report file (PDF or image)</label>
          <input id="lab-file" type="file" accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>

        <div className="form-group">
          <label htmlFor="lab-remarks">Remarks (optional)</label>
          <input id="lab-remarks" className="form-control" value={remarks}
            onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Fasting blood sugar" />
        </div>

        <button type="button" className="btn btn-primary" onClick={handleUpload} disabled={busy}>
          {busy ? "Uploading…" : "Upload Report"}
        </button>

        <h3 style={{ margin: "24px 0 8px" }}>Reports</h3>
        {reports.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>
            No reports to show. Enter an appointment ID and click “Show Reports”.
          </p>
        ) : (
          reports.map((r) => (
            <div key={r.reportId} style={{ padding: 12, border: "1px solid var(--color-border)", marginTop: 10, borderRadius: 8 }}>
              <p><b>Report #{r.reportId}</b> · {r.reportType}</p>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                Uploaded {r.uploadTime ? new Date(r.uploadTime).toLocaleString("en-IN") : "—"}
                {r.remarks ? ` · ${r.remarks}` : ""}
              </p>
            </div>
          ))
        )}
      </div>
    </PageLayout>
  );
}
