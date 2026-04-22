import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'

export default function PatientRecords() {
  const { user } = useAuth()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (!user?.userId) return
    axiosInstance.get(`/patient/records/${user.userId}`)
      .then(res => { setRecord(res.data); setError(null) })
      .catch(() => {
        // If no record exists yet, show empty state instead of error
        setRecord({ diagnoses: 'No diagnoses recorded yet.', observations: 'No observations recorded yet.' })
        setError(null)
      })
      .finally(() => setLoading(false))
  }, [user?.userId])
    const handleUpload = async () => {
    if (!file) {
      alert("Select a file first")
      return
    }

      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("http://localhost:8080/api/records/upload", {
          method: "POST",
          body: formData
        })

        if (res.ok) {
          alert("Uploaded successfully")
        } else {
          alert("Upload failed")
        }
      } catch (err) {
        console.error(err)
        alert("Error uploading")
      }
    }

  return (
    <PageLayout>
      <PageTitle title="Medical Records" subtitle="Your consolidated health record" />
      {loading ? <Spinner /> : (
        <div style={{
          width: '100%', maxWidth: 760, background: '#fff',
          padding: 24, borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ marginBottom: 18, fontSize: 22, fontWeight: 700 }}>Medical Record</h2>

          <div style={{ marginBottom: 18, lineHeight: 1.7 }}>
            <strong style={{ display: 'block', marginBottom: 4 }}>Diagnoses</strong>
            <p style={{ color: record?.diagnoses?.startsWith('No') ? 'var(--color-text-muted)' : 'inherit', margin: 0 }}>
              {record?.diagnoses || 'No diagnoses recorded yet.'}
            </p>
          </div>

          <div style={{ marginBottom: 18, lineHeight: 1.7 }}>
            <strong style={{ display: 'block', marginBottom: 4 }}>Observations</strong>
            <p style={{ color: record?.observations?.startsWith('No') ? 'var(--color-text-muted)' : 'inherit', margin: 0 }}>
              {record?.observations || 'No observations recorded yet.'}
            </p>
          </div>

          <div style={{
            padding: '10px 14px', background: '#fdf0f4', borderRadius: 8,
            fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8
          }}>
            💡 Your medical records are updated by your doctor after each consultation.
          </div>
          <div style={{ marginTop: 20 }}>
  <input
    type="file"
    accept="image/*,application/pdf"
    onChange={(e) => setFile(e.target.files[0])}
    style={{ marginBottom: 10 }}
  />

  <button
    onClick={handleUpload}
    style={{
      padding: '10px 16px',
      background: '#e75480',
      color: '#fff',
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer'
    }}
  >
    Upload Record
  </button>
</div>
        </div>
      )}
    </PageLayout>
  )
}
