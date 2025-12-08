export class QuizResponseDto {
  id: number
  title: string
  description?: string
  courseId?: number
  lessonId?: number
  duration?: number
  isPublished: boolean
  randomizeQuestions: boolean
  questionOrder?: any
  createdAt: Date
  updatedAt: Date
  course?: any
  lesson?: any
  stats?: {
    totalQuestions: number
    totalAttempts: number
    averageScore?: number
    userAttempt?: {
      score?: number
      submittedAt?: Date
    }
  }

  constructor(quiz: any) {
    this.id = quiz.id
    this.title = quiz.title
    this.description = quiz.description ?? undefined
    this.courseId = quiz.courseId ?? undefined
    this.lessonId = quiz.lessonId ?? undefined
    this.duration = quiz.duration ?? undefined
    this.isPublished = quiz.isPublished
    this.randomizeQuestions = quiz.randomizeQuestions
    this.questionOrder = quiz.questionOrder
    this.createdAt = quiz.createdAt
    this.updatedAt = quiz.updatedAt
  }
}