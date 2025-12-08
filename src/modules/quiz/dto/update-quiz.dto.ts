import { IsString, IsOptional, IsInt, IsBoolean, Min, Max } from 'class-validator'
import { Transform } from 'class-transformer'

export class UpdateQuizDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string | null

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined
    if (value === null || value === '') return null
    return parseInt(value)
  })
  courseId?: number | null

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined
    if (value === null || value === '') return null
    return parseInt(value)
  })
  lessonId?: number | null

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  @Transform(({ value }) => {
    if (value === undefined) return undefined
    if (value === null || value === '') return null
    const num = parseInt(value)
    return isNaN(num) ? null : num
  })
  duration?: number | null

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined) return undefined
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === true || value === false) return value
    return undefined
  })
  isPublished?: boolean

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined) return undefined
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === true || value === false) return value
    return undefined
  })
  randomizeQuestions?: boolean

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined
    if (value === null || value === '') return null
    try {
      if (typeof value === 'string') {
        return JSON.parse(value)
      }
      return value
    } catch {
      return null
    }
  })
  questionOrder?: any | null
}