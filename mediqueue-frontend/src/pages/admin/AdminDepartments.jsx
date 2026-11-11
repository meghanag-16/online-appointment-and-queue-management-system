import { useEffect, useState } from 'react'
import { getAllDepartments, addDepartment } from '../../api/adminApi'
import { errorMessage } from '../../api/axiosInstance'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import { Button, Card, EmptyState, ErrorState, Input, LoadingState, useToast } from '../../components/ui'

export default function AdminDepartments() {
  const toast = useToast()
  const [departments, setDepartments] = useState(null)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      setDepartments((await getAllDepartments()).data)
      setLoadError('')
    } catch (err) {
      setDepartments([])
      setLoadError(errorMessage(err, 'Could not load departments.'))
    }
  }
  useEffect(() => {
    load()
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('Enter a department name.')
      return
    }
    setNameError('')
    setSaving(true)
    try {
      await addDepartment({ departmentName: name.trim() })
      toast.success(`Department "${name.trim()}" added.`)
      setName('')
      load()
    } catch (err) {
      setNameError(errorMessage(err, 'Could not add the department.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout>
      <PageTitle title="Departments" subtitle="Create and view hospital departments" />
      <div className="stack max-w-lg">
        <Card title="Add department" as="form" onSubmit={handleAdd}>
          <div className="row row-top">
            <Input
              id="dept-name"
              label="Department name"
              required
              maxLength={100}
              fieldClassName="grow"
              placeholder="e.g. Neurology"
              value={name}
              error={nameError}
              onChange={e => setName(e.target.value)}
            />
            <Button type="submit" loading={saving} className="mt-6">
              Add department
            </Button>
          </div>
        </Card>

        <Card title="All departments">
          <ErrorState message={loadError} onRetry={load} />
          {departments === null && <LoadingState />}
          {departments?.length === 0 && !loadError && <EmptyState icon="🏥" title="No departments yet" />}
          {departments?.length > 0 && (
            <div className="divider-list">
              {departments.map(d => (
                <div key={d.departmentId} className="row-between">
                  <strong>{d.departmentName}</strong>
                  <span className="muted text-xs">{d.departmentId}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  )
}
