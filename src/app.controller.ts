import {
  Controller,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import AdmZip = require('adm-zip');

export class StorageObjectDto {
  @ApiProperty({ type: 'string', format: 'binary', required: true })
  file: Express.Multer.File;
}

@ApiTags()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  @ApiOperation({ summary: 'Convert JSON FHIR to HL7 V2 message' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  getConvertedFiles(@UploadedFile() file: Express.Multer.File): StreamableFile {
    const objectPatient = JSON.parse(file.buffer.toString());

    const res = this.appService.createMessage(objectPatient);

    const zip = new AdmZip();

    zip.addFile('HL7PatientFileCreation.hl7', Buffer.from(res, 'utf8'));

    const willSendthis = zip.toBuffer();

    return new StreamableFile(willSendthis);
  }
}
