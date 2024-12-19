import { Exclude, Expose } from 'class-transformer';

export class ReturnNgoDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  website_url: string;

  @Expose()
  description: string;

  @Expose()
  address: string;

  @Expose()
  contact: string;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  password: string;

  @Exclude()
  email: string;

  @Exclude()
  salt: string;

  constructor(partial: Partial<ReturnNgoDto>) {
    Object.assign(this, partial);
  }
}
