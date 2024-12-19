import { Expose } from 'class-transformer';

export class ReturnProjectDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  fundraising_goal: number;

  @Expose()
  fundraising_current: number;

  @Expose()
  fundraising_closed: boolean;

  @Expose()
  progress: number;

  @Expose()
  archived: boolean;

  @Expose()
  target_date: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  category: string;

  @Expose()
  ngoId?: number;

  constructor(partial: Partial<ReturnProjectDto>) {
    Object.assign(this, partial);
  }
}
