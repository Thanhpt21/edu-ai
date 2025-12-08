export class QuizQuestionResponseDto {
  id: number;
  quizId: number;
  question: string;
  options: any[];
  correct: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(quizQuestion: any) {
    this.id = quizQuestion.id;
    this.quizId = quizQuestion.quizId;
    this.question = quizQuestion.question;
    this.options = quizQuestion.options;
    this.correct = quizQuestion.correct;
    this.createdAt = quizQuestion.createdAt;
    this.updatedAt = quizQuestion.updatedAt;
  }
}