import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'nosh-heaven-videos';
export const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

export interface StorageProvider {
    generateUploadUrl(
        userId: string,
        fileName: string,
        contentType: string,
        folder: string,
        expiresIn?: number,
        metadata?: Record<string, string>
    ): Promise<{ uploadUrl: string; key: string; publicUrl: string }>;

    generateAccessUrl(key: string, expiresIn?: number): Promise<string>;

    deleteFile(key: string): Promise<void>;

    getPublicUrl(key: string): string;
}

export class S3StorageProvider implements StorageProvider {
    private client: S3Client;
    private bucket: string;
    private cloudFrontDomain?: string;

    constructor() {
        this.client = new S3Client({
            region: process.env.AWS_REGION || 'eu-west-2',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });
        this.bucket = BUCKET_NAME;
        this.cloudFrontDomain = CLOUDFRONT_DOMAIN;
    }

    async generateUploadUrl(
        userId: string,
        fileName: string,
        contentType: string,
        folder: string,
        expiresIn: number = 3600,
        metadata: Record<string, string> = {}
    ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `${folder}/${userId}/${timestamp}_${sanitizedFileName}`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
            Metadata: {
                userId,
                uploadedAt: timestamp.toString(),
                ...metadata,
            },
        });

        const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });
        const publicUrl = this.getPublicUrl(key);

        return { uploadUrl, key, publicUrl };
    }

    async generateAccessUrl(key: string, expiresIn: number = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return await getSignedUrl(this.client, command, { expiresIn });
    }

    async deleteFile(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        await this.client.send(command);
    }

    getPublicUrl(key: string): string {
        return this.cloudFrontDomain
            ? `https://${this.cloudFrontDomain}/${key}`
            : `https://${this.bucket}.s3.amazonaws.com/${key}`;
    }
}

export class AzureStorageProvider implements StorageProvider {
    private connectionString: string;
    private containerName: string;

    constructor() {
        this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
        this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'cribnosh-documents';
    }

    async generateUploadUrl(
        userId: string,
        fileName: string,
        contentType: string,
        folder: string,
        expiresIn: number = 3600,
        metadata: Record<string, string> = {}
    ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
        const { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } = await import('@azure/storage-blob');

        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `${folder}/${userId}/${timestamp}_${sanitizedFileName}`;

        const blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
        const containerClient = blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(key);

        // Parse connection string for account name and key to generate SAS
        const match = this.connectionString.match(/AccountName=([^;]+);AccountKey=([^;]+)/);
        if (!match) throw new Error('Invalid Azure Storage Connection String');

        const accountName = match[1];
        const accountKey = match[2];
        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

        const sasToken = generateBlobSASQueryParameters({
            containerName: this.containerName,
            blobName: key,
            permissions: BlobSASPermissions.parse('w'), // write permission
            startsOn: new Date(),
            expiresOn: new Date(new Date().valueOf() + expiresIn * 1000),
            contentType: contentType,
        }, sharedKeyCredential).toString();

        const uploadUrl = `${blockBlobClient.url}?${sasToken}`;
        const publicUrl = this.getPublicUrl(key);

        return { uploadUrl, key, publicUrl };
    }

    async generateAccessUrl(key: string, expiresIn: number = 3600): Promise<string> {
        const { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } = await import('@azure/storage-blob');

        const blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
        const containerClient = blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(key);

        const match = this.connectionString.match(/AccountName=([^;]+);AccountKey=([^;]+)/);
        if (!match) throw new Error('Invalid Azure Storage Connection String');

        const accountName = match[1];
        const accountKey = match[2];
        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

        const sasToken = generateBlobSASQueryParameters({
            containerName: this.containerName,
            blobName: key,
            permissions: BlobSASPermissions.parse('r'), // read permission
            startsOn: new Date(),
            expiresOn: new Date(new Date().valueOf() + expiresIn * 1000),
        }, sharedKeyCredential).toString();

        return `${blockBlobClient.url}?${sasToken}`;
    }

    async deleteFile(key: string): Promise<void> {
        const { BlobServiceClient } = await import('@azure/storage-blob');
        const blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
        const containerClient = blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(key);
        await blockBlobClient.delete();
    }

    getPublicUrl(key: string): string {
        // This assumes the container or blob has public read access configured, or uses a CDN
        // For simple usage, we return the direct blob URL
        const accountName = this.connectionString.match(/AccountName=([^;]+)/)?.[1];
        return `https://${accountName}.blob.core.windows.net/${this.containerName}/${key}`;
    }
}

const providerType = process.env.CLOUD_PROVIDER || 'aws';
export const storage: StorageProvider = providerType === 'azure'
    ? new AzureStorageProvider()
    : new S3StorageProvider();
