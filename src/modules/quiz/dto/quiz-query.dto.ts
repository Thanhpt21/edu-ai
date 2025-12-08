import { IsOptional, IsString, IsInt, IsBoolean, Min } from 'class-validator'
import { Type, Transform } from 'class-transformer'

export class QuizQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
  courseId?: number

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
  lessonId?: number

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === true || value === false) return value
    return undefined
  })
  isPublished?: boolean

  @IsOptional()
  @IsString()
  search?: string
}