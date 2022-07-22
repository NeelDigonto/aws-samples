import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { response } from 'express';
import fs, { write } from 'fs';
import { Readable } from 'stream';

export namespace s3 {
  export async function getObject(bucket: string, region: string, key: string) {
    const client = new S3Client({ region: region, apiVersion: '2006-03-01' });
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return client.send(command);
  }

  export async function putObject(
    bucket: string,
    region: string,
    key: string,
    file: Readable,
  ) {
    const client = new S3Client({ region: region, apiVersion: '2006-03-01' });
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
    });
    return client.send(command);
  }

  export async function getPresignedGetUrl(
    bucket: string,
    region: string,
    key: string,
    expires: number = 10 * 60,
  ) {
    const client = new S3Client({ region: region, apiVersion: '2006-03-01' });
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(client, command, { expiresIn: expires });
    return url;
  }

  export async function getPresignedPostUrl(
    bucket: string,
    region: string,
    key: string,
    expires: number = 10 * 60,
  ) {
    const Fields = {
      acl: 'public-read',
    };
    const client = new S3Client({ region: region, apiVersion: '2006-03-01' });
    return createPresignedPost(client, {
      Bucket: bucket,
      Key: key,
      Fields,
      Expires: expires,
    });
  }

  export namespace test {
    export async function getObject() {
      const filename = 'assets/GetObjectCommand.jpg';
      if (!fs.existsSync(filename)) {
        const fd = fs.openSync(filename, 'w');
        fs.closeSync(fd);
      }

      const writeStream = fs.createWriteStream(filename);
      writeStream.on('open', () => {
        s3.getObject(
          'emerald-city',
          'ap-south-1',
          'textures/v7/albedo.jpg',
        ).then((readable) => (readable.Body as Readable).pipe(writeStream));
      });
    }

    export async function putObject() {
      const filename = 'assets/GetObjectCommand.jpg';

      const readStream = fs.createReadStream(filename);

      readStream.on('open', () => {
        s3.putObject(
          'emerald-city',
          'ap-south-1',
          'test/albedo.jpg',
          readStream,
        );
      });
    }

    export async function getPresignedGetUrl() {
      console.log(
        await s3.getPresignedGetUrl(
          'emerald-city',
          'ap-south-1',
          'test/albedo.jpg',
          600,
        ),
      );
    }

    export async function getPresignedPostUrl() {
      console.log(
        await s3.getPresignedPostUrl(
          'emerald-city',
          'ap-south-1',
          'test/albedo.jpg',
          600,
        ),
      );
    }
  }
}
