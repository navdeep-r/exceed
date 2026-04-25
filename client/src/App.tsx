import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TeacherLayout from './layouts/TeacherLayout'
import StudentLayout from './layouts/StudentLayout'

// Teacher pages
import TeacherDashboard from './pages/teacher/Dashboard'
import RecordLecture from './pages/teacher/RecordLecture'
import ManageNotes from './pages/teacher/ManageNotes'
import EditNotes from './pages/teacher/EditNotes'
import TeacherDoubts from './pages/teacher/Doubts'
import TeacherAnalytics from './pages/teacher/Analytics'
import StudentMonitor from './pages/teacher/StudentMonitor'

// Student pages
import StudentDashboard from './pages/student/Dashboard'
import NotesListPage from './pages/student/NotesList'
import NotesViewPage from './pages/student/NotesView'
import QuizListPage from './pages/student/QuizList'
import QuizPlayPage from './pages/student/QuizPlay'
import FlashcardsPage from './pages/student/Flashcards'
import PlannerPage from './pages/student/Planner'
import StudentDoubts from './pages/student/Doubts'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: 'teacher' | 'student' }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-surface-400 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />
  return <>{children}</>
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}`} replace /> : <RegisterPage />} />

      {/* Teacher routes */}
      <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherLayout /></ProtectedRoute>}>
        <Route index element={<TeacherDashboard />} />
        <Route path="record" element={<RecordLecture />} />
        <Route path="notes" element={<ManageNotes />} />
        <Route path="notes/:id" element={<EditNotes />} />
        <Route path="doubts" element={<TeacherDoubts />} />
        <Route path="analytics" element={<TeacherAnalytics />} />
        <Route path="students" element={<StudentMonitor />} />
      </Route>

      {/* Student routes */}
      <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="notes" element={<NotesListPage />} />
        <Route path="notes/:id" element={<NotesViewPage />} />
        <Route path="quiz" element={<QuizListPage />} />
        <Route path="quiz/:id" element={<QuizPlayPage />} />
        <Route path="flashcards/:notesId" element={<FlashcardsPage />} />
        <Route path="planner" element={<PlannerPage />} />
        <Route path="doubts" element={<StudentDoubts />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
