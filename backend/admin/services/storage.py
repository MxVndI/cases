import json
import uuid
from io import BytesIO

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from loguru import logger

from settings import Settings


class StorageService:
    def __init__(self, settings: Settings):
        self.bucket = settings.s3_bucket
        self.public_url = settings.s3_public_url
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",
        )
        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except ClientError:
            logger.info(f"Creating bucket: {self.bucket}")
            self.client.create_bucket(Bucket=self.bucket)
        self._set_public_read_policy()

    def _set_public_read_policy(self):
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": f"arn:aws:s3:::{self.bucket}/*",
                }
            ],
        }
        self.client.put_bucket_policy(Bucket=self.bucket, Policy=json.dumps(policy))
        logger.info(f"Public read policy set for bucket: {self.bucket}")

    async def upload(self, file_data: bytes, filename: str, content_type: str) -> str:
        ext = filename.rsplit(".", 1)[-1] if "." in filename else "png"
        key = f"images/{uuid.uuid4().hex}.{ext}"

        self.client.upload_fileobj(
            BytesIO(file_data),
            self.bucket,
            key,
            ExtraArgs={"ContentType": content_type},
        )

        url = f"{self.public_url}/{self.bucket}/{key}"
        logger.info(f"Uploaded {filename} -> {url}")
        return url
