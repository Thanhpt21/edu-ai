import { IsString, IsOptional, IsInt, IsBoolean, Min, Max } from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateQuizDto {
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value ? parseInt(value) : null)
  courseId?: number | null

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value ? parseInt(value) : null)
  lessonId?: number | null

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  @Transform(({ value }) => value ? parseInt(value) : null)
  duration?: number | null

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === true || value === false) return value
    return false
  })
  isPublished?: boolean = false

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === true || value === false) return value
    return false
  })
  randomizeQuestions?: boolean = false

  @IsOptional()
  @Transform(({ value }) => {
    try {
      if (value && typeof value === 'string') {
        return JSON.parse(value)
      }
      return value || null
    } catch {
      return null
    }
  })
  questionOrder?: any
}