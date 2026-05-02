import { getTasksByUser } from '@/lib/tasks'
import { DashboardClient } from '@/components/dashboard-client'
import { DEMO_USER_ID } from '@/lib/demo-user'

export default async function DashboardPage() {
  const tasks = await getTasksByUser(DEMO_USER_ID)
  return <DashboardClient initialTasks={tasks} />
}
