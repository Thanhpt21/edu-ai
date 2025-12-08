export class QuizAttemptResponseDto {
  id: number;
  quizId: number;
  studentId: number;
  startedAt: Date;
  submittedAt: Date | null;
  score: number | null;
  answers: any[] | null;
  attemptCount: number;
  createdAt: Date;
  updatedAt: Date;

  quiz?: {
    id: number;
    title: string;
    courseId: number | null;
    lessonId: number | null;
    duration: number | null;
  };

  student?: {
    id: number;
    name: string;
    email: string;
  };

  constructor(attempt: any) {
    this.id = attempt.id;
    this.quizId = attempt.quizId;
    this.studentId = attempt.studentId;
    this.startedAt = attempt.startedAt;
    this.submittedAt = attempt.submittedAt;
    this.score = attempt.score;
    this.answers = attempt.answers || null;
    this.attemptCount = attempt.attemptCount;
    this.createdAt = attempt.createdAt || attempt.startedAt;
    this.updatedAt = attempt.updatedAt || attempt.startedAt;

    if (attempt.quiz) {
      this.quiz = {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        courseId: attempt.quiz.courseId,
        lessonId: attempt.quiz.lessonId,
        duration: attempt.quiz.duration,
      };
    }

    if (attempt.student) {
      this.student = {
        id: attempt.student.id,
        name: attempt.student.name || attempt.student.username,
        email: attempt.student.email,
      };
    }
  }
}