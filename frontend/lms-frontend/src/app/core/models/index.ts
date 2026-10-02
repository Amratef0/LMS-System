export interface User { id: number; name: string; email: string; role: 'Admin'|'Coordinator'|'Student'; preferredLanguage?: string; }
export interface AuthResponse { token: string; user: User; }
export interface Session { id: number; name: string; trainer: { id: number; name: string }; sessionDate: string; type: string; topic: string; status: string; group: { id: number; name: string; code: string }; recordLink?: string; location?: string; }
export interface SessionDetail extends Session { attendanceStatus: string; attendance: { total: number; joined: number }; timeTracking: any; attachments: Attachment[]; quizzes: any[]; assignments: any[]; }
export interface Attachment { id: number; title: string; fileUrl?: string; link?: string; attachmentType: string; uploadedBy: string; createdAt: string; }
export interface Group { id: number; name: string; code: string; startDate: string; endDate: string; isActive: boolean; trainerName?: string; studentsCount?: number; }
export interface Student { id: number; name: string; email: string; phone?: string; nationalId?: string; city?: string; gender?: string; isActive: boolean; groupName?: string; }
export interface Quiz { id: number; title: string; type: string; isGraded: boolean; createdAt: string; dueDate?: string; quizLevel: string; session?: any; submissionsCount: number; }
export interface Assignment { id: number; title: string; isGraded: boolean; createdAt: string; dueDate?: string; assignmentLevel: string; session?: any; submissionsCount: number; }
export interface Ticket { id: number; title: string; description: string; status: string; createdAt: string; student: any; repliesCount: number; }
export interface PaginatedResult<T> { total: number; page: number; pageSize: number; items: T[]; }
export interface DashboardStats { totalStudents: number; totalAssessments: number; totalQuizzes: number; avgRating: number; sessions: any; attendance: any; quizzes: any; assignments: any; gender: any; }
