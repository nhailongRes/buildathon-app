import { getTasksByUser } from '@/lib/tasks'
import { DashboardClient } from '@/components/dashboard-client'

const DEMO_USER_ID = 'demo-user-1'

export default async function DashboardPage() {
  const tasks = await getTasksByUser(DEMO_USER_ID)
  return <DashboardClient initialTasks={tasks} />
}
