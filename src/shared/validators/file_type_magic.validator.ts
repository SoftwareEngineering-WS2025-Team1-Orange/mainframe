import { FileTypeValidator, FileValidator } from '@nestjs/common';
import { FileTypeValidatorOptions } from '@nestjs/common/pipes/file/file-type.validator';
import imageType from 'image-type';

type FileTypeMagicValidatorOptions = FileTypeValidatorOptions & {
  allowedMimeTypes: string[];
  allowedFileExtensions: string[];
};

export class FileTypeExtendedValidator extends FileValidator {
  private fileTypeValidator: FileTypeValidator;

  private allowedMimeTypes: string[];

  private allowedFileExtensions: string[];

  constructor(
    protected readonly validationOptions: FileTypeMagicValidatorOptions,
  ) {
    super({});
    const { allowedMimeTypes, allowedFileExtensions } = validationOptions;
    this.allowedMimeTypes = allowedMimeTypes;
    this.allowedFileExtensions = allowedFileExtensions;

    this.fileTypeValidator = new FileTypeValidator(validationOptions);
  }

  async isValid(file: Express.Multer.File): Promise<boolean> {
    const fileType = await imageType(file.buffer);

    if (
      !this.allowedMimeTypes.includes(fileType.mime) ||
      !this.allowedFileExtensions.includes(fileType.ext)
    ) {
      return false;
    }

    return this.fileTypeValidator.isValid(file);
  }

  buildErrorMessage(file: Express.Multer.File): string {
    if (!this.fileTypeValidator.isValid(file)) {
      return this.fileTypeValidator.buildErrorMessage();
    }
    return `File type is not allowed. Allowed types are: ${this.allowedMimeTypes.join(
      ', ',
    )} and extensions: ${this.allowedFileExtensions.join(', ')}.`;
  }
}
