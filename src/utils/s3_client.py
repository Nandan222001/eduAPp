import boto3
from typing import Optional, BinaryIO, Union
from botocore.exceptions import ClientError
from src.config import settings
import uuid
from datetime import datetime
from io import BytesIO


class S3Client:
    def __init__(self):
        self.s3_client = None
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region
            )
        self.bucket_name = settings.s3_bucket_name

    def upload_file(
        self,
        file_content: Union[bytes, BinaryIO],
        s3_key: str,
        content_type: Optional[str] = None
    ) -> str:
        if not self.s3_client or not self.bucket_name:
            raise ValueError("S3 is not configured properly")

        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type

            if isinstance(file_content, bytes):
                file_obj = BytesIO(file_content)
            else:
                file_obj = file_content

            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                s3_key,
                ExtraArgs=extra_args
            )

            file_url = f"https://{self.bucket_name}.s3.{settings.aws_region}.amazonaws.com/{s3_key}"
            return file_url

        except ClientError as e:
            raise Exception(f"Failed to upload file to S3: {str(e)}")
    
    def download_file(self, s3_key: str) -> bytes:
        if not self.s3_client or not self.bucket_name:
            raise ValueError("S3 is not configured properly")

        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=s3_key)
            return response['Body'].read()
        except ClientError as e:
            raise Exception(f"Failed to download file from S3: {str(e)}")

    def delete_file(self, s3_key: str) -> bool:
        if not self.s3_client or not self.bucket_name:
            raise ValueError("S3 is not configured properly")

        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError as e:
            raise Exception(f"Failed to delete file from S3: {str(e)}")

    def generate_presigned_url(self, s3_key: str, expiration: int = 3600) -> str:
        if not self.s3_client or not self.bucket_name:
            raise ValueError("S3 is not configured properly")

        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            raise Exception(f"Failed to generate presigned URL: {str(e)}")

    def file_exists(self, s3_key: str) -> bool:
        if not self.s3_client or not self.bucket_name:
            return False

        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError:
            return False


s3_client = S3Client()
