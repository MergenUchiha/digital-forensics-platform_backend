import { PrismaClient, Role, CaseStatus, Severity, EvidenceType, EventType, CustodyAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Очистка существующих данных
  await prisma.timelineEvent.deleteMany();
  await prisma.chainOfCustodyEntry.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.case.deleteMany();
  await prisma.user.deleteMany();

  // Создание пользователей
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const analyst = await prisma.user.create({
    data: {
      email: 'analyst@forensics.io',
      password: hashedPassword,
      name: 'Alex Johnson',
      role: Role.ANALYST,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@forensics.io',
      password: hashedPassword,
      name: 'Sarah Admin',
      role: Role.ADMIN,
    },
  });

  console.log('✅ Created users');

  // Создание дел
  const case1 = await prisma.case.create({
    data: {
      title: 'AWS S3 Bucket Data Breach',
      description: 'Unauthorized access detected to production S3 bucket containing customer PII. Multiple GET requests from unknown IP addresses.',
      status: CaseStatus.IN_PROGRESS,
      severity: Severity.CRITICAL,
      tags: ['aws', 'data-breach', 's3', 'pii'],
      locationCity: 'San Francisco',
      locationCountry: 'USA',
      locationLat: 37.7749,
      locationLng: -122.4194,
      evidenceCount: 0,
      eventsCount: 0,
      suspiciousActivities: 0,
      createdById: analyst.id,
      assignedToId: analyst.id,
    },
  });

  const case2 = await prisma.case.create({
    data: {
      title: 'IoT Camera Botnet Activity',
      description: 'Smart security cameras exhibiting unusual network behavior. Suspected Mirai variant infection across 50+ devices.',
      status: CaseStatus.OPEN,
      severity: Severity.HIGH,
      tags: ['iot', 'botnet', 'mirai', 'cameras'],
      locationCity: 'London',
      locationCountry: 'UK',
      locationLat: 51.5074,
      locationLng: -0.1278,
      evidenceCount: 0,
      eventsCount: 0,
      suspiciousActivities: 0,
      createdById: admin.id,
    },
  });

  const case3 = await prisma.case.create({
    data: {
      title: 'Azure Container Registry Compromise',
      description: 'Malicious Docker image pushed to private ACR. Image contains cryptocurrency miner and reverse shell.',
      status: CaseStatus.IN_PROGRESS,
      severity: Severity.CRITICAL,
      tags: ['azure', 'container', 'malware', 'cryptominer'],
      locationCity: 'Berlin',
      locationCountry: 'Germany',
      locationLat: 52.5200,
      locationLng: 13.4050,
      evidenceCount: 0,
      eventsCount: 0,
      suspiciousActivities: 0,
      createdById: analyst.id,
      assignedToId: analyst.id,
    },
  });

  console.log('✅ Created cases');

  // Создание доказательств
  const evidence1 = await prisma.evidence.create({
    data: {
      name: 'cloudtrail_logs_20241220.json',
      type: EvidenceType.LOG,
      description: 'AWS CloudTrail logs showing unauthorized S3 access attempts',
      filePath: '/evidence/cloudtrail_logs_20241220.json',
      fileSize: 2457600,
      md5Hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      metadata: {
        source: 'AWS CloudTrail',
        region: 'us-west-2',
        timeRange: '2024-12-20 00:00:00 - 08:30:00',
      },
      caseId: case1.id,
      uploadedById: analyst.id,
    },
  });

  const evidence2 = await prisma.evidence.create({
    data: {
      name: 's3_access_logs.csv',
      type: EvidenceType.LOG,
      description: 'S3 bucket access logs for the affected bucket',
      filePath: '/evidence/s3_access_logs.csv',
      fileSize: 1843200,
      md5Hash: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
      sha256Hash: 'f4a8c55d8ed8b5c8e3a4f3c8996fb92427ae41e4649b934ca495991b7852b855',
      metadata: {
        source: 'S3 Server Access Logs',
        bucket: 'prod-customer-data',
      },
      caseId: case1.id,
      uploadedById: analyst.id,
    },
  });

  console.log('✅ Created evidence');

  // Создание цепочки хранения
  await prisma.chainOfCustodyEntry.create({
    data: {
      action: CustodyAction.COLLECTED,
      notes: 'Collected from AWS CloudTrail via API',
      evidenceId: evidence1.id,
      performedById: analyst.id,
    },
  });

  await prisma.chainOfCustodyEntry.create({
    data: {
      action: CustodyAction.ANALYZED,
      notes: 'Initial analysis completed',
      evidenceId: evidence1.id,
      performedById: analyst.id,
    },
  });

  console.log('✅ Created chain of custody entries');

  // Создание событий временной шкалы
  await prisma.timelineEvent.createMany({
    data: [
      {
        timestamp: new Date('2024-12-20T03:24:15Z'),
        type: EventType.AUTHENTICATION,
        source: 'AWS CloudTrail',
        severity: Severity.MEDIUM,
        title: 'Unusual API Authentication',
        description: 'API authentication from unknown IP address 185.220.101.42',
        metadata: {
          ipAddress: '185.220.101.42',
          userAgent: 'aws-cli/2.13.0',
          country: 'Russia',
        },
        ipAddresses: ['185.220.101.42'],
        usernames: ['arn:aws:iam::123456789012:user/unknown'],
        files: [],
        devices: [],
        caseId: case1.id,
      },
      {
        timestamp: new Date('2024-12-20T03:25:03Z'),
        type: EventType.API_CALL,
        source: 'AWS CloudTrail',
        severity: Severity.CRITICAL,
        title: 'S3 ListBucket Operation',
        description: 'Unauthorized ListBucket operation on prod-customer-data',
        metadata: {
          bucket: 'prod-customer-data',
          operation: 'ListBucket',
          success: true,
        },
        ipAddresses: ['185.220.101.42'],
        usernames: [],
        files: [],
        devices: [],
        caseId: case1.id,
      },
      {
        timestamp: new Date('2024-12-20T03:26:18Z'),
        type: EventType.API_CALL,
        source: 'AWS CloudTrail',
        severity: Severity.CRITICAL,
        title: 'Multiple S3 GetObject Calls',
        description: '247 GetObject operations performed within 3 minutes',
        metadata: {
          bucket: 'prod-customer-data',
          objectsAccessed: 247,
          dataTransferred: '1.2 GB',
        },
        ipAddresses: ['185.220.101.42'],
        usernames: [],
        files: [],
        devices: [],
        caseId: case1.id,
      },
      {
        timestamp: new Date('2024-12-20T03:42:05Z'),
        type: EventType.ALERT,
        source: 'AWS GuardDuty',
        severity: Severity.CRITICAL,
        title: 'GuardDuty Alert: Exfiltration',
        description: 'Data exfiltration detected from S3 bucket',
        metadata: {
          alertType: 'Exfiltration:S3/ObjectRead.Unusual',
          confidence: 'High',
        },
        ipAddresses: ['185.220.101.42'],
        usernames: [],
        files: [],
        devices: [],
        caseId: case1.id,
      },
    ],
  });

  console.log('✅ Created timeline events');

  // Обновление статистики дел
  await prisma.case.update({
    where: { id: case1.id },
    data: {
      evidenceCount: 2,
      eventsCount: 4,
      suspiciousActivities: 3,
    },
  });

  console.log('✅ Updated case statistics');

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📝 Test credentials:');
  console.log('   Email: analyst@forensics.io');
  console.log('   Password: demo123');
  console.log('');
  console.log('   Email: admin@forensics.io');
  console.log('   Password: demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });