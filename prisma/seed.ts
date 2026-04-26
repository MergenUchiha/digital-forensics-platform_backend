// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Предсказуемые UUID для демо-данных
const DEMO_IDS = {
  users: {
    analyst: '00000000-0000-0000-0000-000000000001',
    admin: '00000000-0000-0000-0000-000000000002',
  },
  cases: {
    case1: '00000000-0000-0000-0000-000000000011',
    case2: '00000000-0000-0000-0000-000000000012',
    case3: '00000000-0000-0000-0000-000000000013',
    case4: '00000000-0000-0000-0000-000000000014',
  },
  evidence: {
    evidence1: '00000000-0000-0000-0000-000000000021',
    evidence2: '00000000-0000-0000-0000-000000000022',
    evidence3: '00000000-0000-0000-0000-000000000023',
    evidence4: '00000000-0000-0000-0000-000000000024',
    evidence5: '00000000-0000-0000-0000-000000000025',
    evidence6: '00000000-0000-0000-0000-000000000026',
    evidence7: '00000000-0000-0000-0000-000000000027',
    evidence8: '00000000-0000-0000-0000-000000000028',
    evidence9: '00000000-0000-0000-0000-000000000029',
    evidence10: '00000000-0000-0000-0000-000000000030',
    evidence11: '00000000-0000-0000-0000-000000000031',
    evidence12: '00000000-0000-0000-0000-000000000032',
  },
};

async function main() {
  console.log('🌱 Starting database seed...');

  // Очистка существующих данных
  console.log('🗑️  Cleaning existing data...');
  await prisma.timelineEvent.deleteMany();
  await prisma.chainOfCustodyEntry.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.case.deleteMany();
  await prisma.user.deleteMany();

  // Создание пользователей с предсказуемыми ID
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('REDACTED-ROTATE-SEED-PASSWORD', 10);

  const analyst = await prisma.user.create({
    data: {
      id: DEMO_IDS.users.analyst,
      email: 'analyst@forensics.io',
      password: hashedPassword,
      name: 'Alex Johnson',
      role: 'ANALYST',
    },
  });

  const admin = await prisma.user.create({
    data: {
      id: DEMO_IDS.users.admin,
      email: 'admin@forensics.io',
      password: hashedPassword,
      name: 'Sarah Admin',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created users:');
  console.log(`   - Analyst: ${analyst.email} (ID: ${analyst.id})`);
  console.log(`   - Admin: ${admin.email} (ID: ${admin.id})`);

  // Создание дел с предсказуемыми ID
  console.log('\n📁 Creating cases...');

  const case1 = await prisma.case.create({
    data: {
      id: DEMO_IDS.cases.case1,
      title: 'AWS S3 Bucket Data Breach',
      description: 'Unauthorized access detected to production S3 bucket containing customer PII. Multiple GET requests from unknown IP addresses.',
      status: 'IN_PROGRESS',
      severity: 'CRITICAL',
      tags: JSON.stringify(['aws', 'data-breach', 's3', 'pii']),
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
      id: DEMO_IDS.cases.case2,
      title: 'IoT Camera Botnet Activity',
      description: 'Smart security cameras exhibiting unusual network behavior. Suspected Mirai variant infection across 50+ devices.',
      status: 'OPEN',
      severity: 'HIGH',
      tags: JSON.stringify(['iot', 'botnet', 'mirai', 'cameras']),
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
      id: DEMO_IDS.cases.case3,
      title: 'Azure Container Registry Compromise',
      description: 'Malicious Docker image pushed to private ACR. Image contains cryptocurrency miner and reverse shell.',
      status: 'IN_PROGRESS',
      severity: 'CRITICAL',
      tags: JSON.stringify(['azure', 'container', 'malware', 'cryptominer']),
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

  const case4 = await prisma.case.create({
    data: {
      id: DEMO_IDS.cases.case4,
      title: 'GCP API Key Exposure',
      description: 'GCP service account key found in public GitHub repository. Multiple API calls from various locations detected.',
      status: 'CLOSED',
      severity: 'HIGH',
      tags: JSON.stringify(['gcp', 'credential-leak', 'github', 'api']),
      locationCity: 'Tokyo',
      locationCountry: 'Japan',
      locationLat: 35.6762,
      locationLng: 139.6503,
      evidenceCount: 0,
      eventsCount: 0,
      suspiciousActivities: 0,
      createdById: analyst.id,
      assignedToId: analyst.id,
    },
  });

  console.log('✅ Created cases:');
  console.log(`   - Case 1: ${case1.title} (ID: ${case1.id})`);
  console.log(`   - Case 2: ${case2.title} (ID: ${case2.id})`);
  console.log(`   - Case 3: ${case3.title} (ID: ${case3.id})`);
  console.log(`   - Case 4: ${case4.title} (ID: ${case4.id})`);

  // Создание доказательств
  console.log('\n📄 Creating evidence...');

  // === Case 1: AWS S3 Data Breach — разные типы доказательств ===
  const evidence1 = await prisma.evidence.create({
    data: {
      id: DEMO_IDS.evidence.evidence1,
      name: 'cloudtrail_logs_20241220.json',
      type: 'LOG',
      description: 'AWS CloudTrail logs showing unauthorized S3 access attempts',
      filePath: '/evidence/cloudtrail_logs_20241220.json',
      fileSize: 2457600,
      md5Hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      metadata: JSON.stringify({
        source: 'AWS CloudTrail',
        region: 'us-west-2',
        timeRange: '2024-12-20 00:00:00 - 08:30:00',
      }),
      caseId: case1.id,
      uploadedById: analyst.id,
    },
  });

  const evidence2 = await prisma.evidence.create({
    data: {
      id: DEMO_IDS.evidence.evidence2,
      name: 's3_access_logs.csv',
      type: 'LOG',
      description: 'S3 bucket access logs for the affected bucket',
      filePath: '/evidence/s3_access_logs.csv',
      fileSize: 1843200,
      md5Hash: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
      sha256Hash: 'f4a8c55d8ed8b5c8e3a4f3c8996fb92427ae41e4649b934ca495991b7852b855',
      metadata: JSON.stringify({
        source: 'S3 Server Access Logs',
        bucket: 'prod-customer-data',
      }),
      caseId: case1.id,
      uploadedById: analyst.id,
    },
  });

  const evidence3 = await prisma.evidence.create({
    data: {
      id: DEMO_IDS.evidence.evidence3,
      name: 'network_capture_exfiltration.pcap',
      type: 'NETWORK_CAPTURE',
      description: 'Network traffic capture during S3 data exfiltration window',
      filePath: '/evidence/network_capture_exfiltration.pcap',
      fileSize: 52428800,
      md5Hash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8',
      sha256Hash: 'a7f2c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b001',
      metadata: JSON.stringify({
        source: 'VPC Flow Logs + tcpdump',
        duration: '45 minutes',
        packetCount: 1284350,
      }),
      caseId: case1.id,
      uploadedById: analyst.id,
    },
  });

  // === Case 2: IoT Camera Botnet — улики с IoT устройствами ===
  const evidence4 = await prisma.evidence.create({
    data: {
      id: DEMO_IDS.evidence.evidence4,
      name: 'camera_firmware_dump.bin',
      type: 'MEMORY_DUMP',
      iotDeviceType: 'CAMERA',
      description: 'Firmware memory dump from compromised Hikvision IP camera DS-2CD2143G2-I',
      filePath: '/evidence/camera_firmware_dump.bin',
      fileSize: 16777216,
      md5Hash: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
      sha256Hash: 'b8c3d55398fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b002',
      metadata: JSON.stringify({
        deviceModel: 'Hikvision DS-2CD2143G2-I',
        firmwareVersion: '5.7.1 build 230315',
        ipAddress: '192.168.1.101',
        macAddress: 'C0:56:E3:AA:BB:01',
      }),
      caseId: case2.id,
      uploadedById: admin.id,
    },
  });

  const evidence5 = await prisma.evidence.create({
    data: {
      id: DEMO_IDS.evidence.evidence5,
      name: 'dvr_network_traffic.pcap',
      type: 'NETWORK_CAPTURE',
      iotDeviceType: 'DVR',
      description: 'Captured network traffic from DVR showing C2 communication with botnet controller',
      filePath: '/evidence/dvr_network_traffic.pcap',
      fileSize: 89400320,
      md5Hash: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
      sha256Hash: 'c9d4e66498fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b003',
      metadata: JSON.stringify({
        deviceModel: 'Dahua XVR5108HS-4KL-I3',
        c2Server: '45.95.169.88:8443',
        protocolDetected: 'Mirai variant TCP flood',
        capturedDuration: '2 hours',
      }),
      caseId: case2.id,
      uploadedById: admin.id,
    },
  });

  const evidence6 = await prisma.evidence.create({
    data: {
      id: DEMO_IDS.evidence.evidence6,
      name: 'router_config_backup.txt',
      type: 'FILE',
      iotDeviceType: 'ROUTER',
      description: 'Configuration dump from edge router showing modified DNS and firewall rules',
      filePath: '/evidence/router_config_backup.txt',
      fileSize: 45056,
      md5Hash: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
      sha256Hash: 'dae5f77598fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b004',
      metadata: JSON.stringify({
        deviceModel: 'MikroTik RB4011',
        firmwareVersion: 'RouterOS 7.6',
        modifiedRules: 12,
        suspiciousDNS: ['45.95.169.88', '185.220.101.42'],
      }),
      caseId: case2.id,
      uploadedById: admin.id,
    },
  });

  const evidence7 = await prisma.evidence.create({
    data: {
      id: DEMO_IDS.evidence.evidence7,
      name: 'smart_speaker_audio_log.wav',
      type: 'FILE',
      iotDeviceType: 'SMART_SPEAKER',
      description: 'Audio log from compromised smart speaker capturing unauthorized voice commands',
      filePath: '/evidence/smart_speaker_audio_log.wav',
      fileSize: 7340032,
      md5Hash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
      sha256Hash: 'ebf6a88698fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b005',
      metadata: JSON.stringify({
        deviceModel: 'Amazon Echo Show 10',
        recordingDuration: '4m 23s',
        suspiciousCommands: ['disable security', 'open port 4444'],
      }),
      caseId: case2.id,
      uploadedById: admin.id,
    },
  });

  const evidence8 = await prisma.evidence.create({
    data: {
      id: DEMO_IDS.evidence.evidence8,
      name: 'sensor_telemetry_anomaly.json',
      type: 'LOG',
      iotDeviceType: 'SENSOR',
      description: 'Temperature and humidity sensor sending falsified telemetry data to MQTT broker',
      filePath: '/evidence/sensor_telemetry_anomaly.json',
      fileSize: 524288,
      md5Hash: 'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3',
      sha256Hash: 'fc07b99798fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b006',
      metadata: JSON.stringify({
        deviceModel: 'Zigbee Aqara WSDCGQ11LM',
        mqttBroker: '192.168.1.1:1883',
        falsifiedReadings: 347,
        normalRange: '18-26°C',
        reportedRange: '-40-85°C',
      }),
      caseId: case2.id,
      uploadedById: analyst.id,
    },
  });

  const evidence9 = await prisma.evidence.create({
    data: {
      id: DEMO_IDS.evidence.evidence9,
      name: 'smart_lock_access_log.csv',
      type: 'LOG',
      iotDeviceType: 'SMART_LOCK',
      description: 'Access log from smart lock showing unauthorized BLE unlock events at odd hours',
      filePath: '/evidence/smart_lock_access_log.csv',
      fileSize: 102400,
      md5Hash: 'c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
      sha256Hash: '0d18ca0898fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b007',
      metadata: JSON.stringify({
        deviceModel: 'August Wi-Fi Smart Lock Pro',
        unauthorizedUnlocks: 8,
        timePattern: '02:00-04:00 AM',
        bleAttackType: 'Replay attack suspected',
      }),
      caseId: case2.id,
      uploadedById: analyst.id,
    },
  });

  // === Case 3: Azure Container — разные типы ===
  const evidence10 = await prisma.evidence.create({
    data: {
      id: DEMO_IDS.evidence.evidence10,
      name: 'malicious_docker_image.tar',
      type: 'DISK_IMAGE',
      description: 'Exported malicious Docker image containing cryptominer and reverse shell',
      filePath: '/evidence/malicious_docker_image.tar',
      fileSize: 268435456,
      md5Hash: 'd0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5',
      sha256Hash: '1e29db1998fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b008',
      metadata: JSON.stringify({
        registry: 'myacr.azurecr.io',
        imageName: 'backend-api:latest',
        layers: 14,
        malwareSignatures: ['XMRig miner', 'Cobalt Strike beacon'],
      }),
      caseId: case3.id,
      uploadedById: analyst.id,
    },
  });

  const evidence11 = await prisma.evidence.create({
    data: {
      id: DEMO_IDS.evidence.evidence11,
      name: 'azure_activity_log.json',
      type: 'API_RESPONSE',
      description: 'Azure Activity Log API response showing registry push events from unknown principal',
      filePath: '/evidence/azure_activity_log.json',
      fileSize: 3145728,
      md5Hash: 'e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
      sha256Hash: '2f3aec2a98fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b009',
      metadata: JSON.stringify({
        subscriptionId: 'sub-12345-abcde',
        callerIp: '103.152.220.44',
        operationName: 'Microsoft.ContainerRegistry/registries/push/write',
      }),
      caseId: case3.id,
      uploadedById: analyst.id,
    },
  });

  // === Case 4: GCP API Key — фото и Smart TV ===
  const evidence12 = await prisma.evidence.create({
    data: {
      id: DEMO_IDS.evidence.evidence12,
      name: 'smart_tv_screenshot.png',
      type: 'PHOTO',
      iotDeviceType: 'SMART_TV',
      description: 'Screenshot from compromised Smart TV displaying GCP credentials on unauthorized dashboard',
      filePath: '/evidence/smart_tv_screenshot.png',
      fileSize: 1048576,
      md5Hash: 'f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
      sha256Hash: '3a4bfd3b98fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b010',
      metadata: JSON.stringify({
        deviceModel: 'Samsung QN85B Neo QLED',
        appName: 'Unauthorized Tizen App',
        resolution: '3840x2160',
        capturedVia: 'SDB remote capture',
      }),
      caseId: case4.id,
      uploadedById: analyst.id,
    },
  });

  console.log('✅ Created 12 evidence items across all cases');

  // Создание цепочки хранения
  console.log('\n🔗 Creating chain of custody...');

  await prisma.chainOfCustodyEntry.createMany({
    data: [
      {
        action: 'COLLECTED',
        notes: 'Collected from AWS CloudTrail via API',
        evidenceId: evidence1.id,
        performedById: analyst.id,
      },
      {
        action: 'ANALYZED',
        notes: 'Initial analysis completed — 247 unauthorized S3 operations identified',
        evidenceId: evidence1.id,
        performedById: analyst.id,
      },
      {
        action: 'COLLECTED',
        notes: 'Firmware dumped from compromised camera via JTAG interface',
        evidenceId: evidence4.id,
        performedById: admin.id,
      },
      {
        action: 'ANALYZED',
        notes: 'Mirai variant binary extracted from firmware at offset 0x4A000',
        evidenceId: evidence4.id,
        performedById: admin.id,
      },
      {
        action: 'TRANSFERRED',
        notes: 'DVR traffic capture transferred to analysis workstation',
        evidenceId: evidence5.id,
        performedById: admin.id,
      },
      {
        action: 'COLLECTED',
        notes: 'Docker image exported from Azure ACR before quarantine',
        evidenceId: evidence10.id,
        performedById: analyst.id,
      },
      {
        action: 'ANALYZED',
        notes: 'Cryptominer (XMRig) and Cobalt Strike beacon detected in layer 11',
        evidenceId: evidence10.id,
        performedById: analyst.id,
      },
      {
        action: 'EXPORTED',
        notes: 'Evidence exported for law enforcement handoff',
        evidenceId: evidence10.id,
        performedById: analyst.id,
      },
    ],
  });

  console.log('✅ Created chain of custody entries');

  // Создание событий временной шкалы
  console.log('\n⏱️  Creating timeline events...');

  await prisma.timelineEvent.createMany({
    data: [
      // === Case 1: AWS S3 Data Breach events ===
      {
        timestamp: new Date('2024-12-20T03:24:15Z'),
        type: 'AUTHENTICATION',
        source: 'AWS CloudTrail',
        severity: 'MEDIUM',
        title: 'Unusual API Authentication',
        description: 'API authentication from unknown IP address 185.220.101.42',
        metadata: JSON.stringify({
          ipAddress: '185.220.101.42',
          userAgent: 'aws-cli/2.13.0',
          country: 'Russia',
        }),
        ipAddresses: JSON.stringify(['185.220.101.42']),
        usernames: JSON.stringify(['arn:aws:iam::123456789012:user/unknown']),
        files: JSON.stringify([]),
        devices: JSON.stringify([]),
        caseId: case1.id,
      },
      {
        timestamp: new Date('2024-12-20T03:25:03Z'),
        type: 'API_CALL',
        source: 'AWS CloudTrail',
        severity: 'CRITICAL',
        title: 'S3 ListBucket Operation',
        description: 'Unauthorized ListBucket operation on prod-customer-data',
        metadata: JSON.stringify({
          bucket: 'prod-customer-data',
          operation: 'ListBucket',
          success: true,
        }),
        ipAddresses: JSON.stringify(['185.220.101.42']),
        usernames: JSON.stringify([]),
        files: JSON.stringify([]),
        devices: JSON.stringify([]),
        caseId: case1.id,
      },
      {
        timestamp: new Date('2024-12-20T03:26:18Z'),
        type: 'API_CALL',
        source: 'AWS CloudTrail',
        severity: 'CRITICAL',
        title: 'Multiple S3 GetObject Calls',
        description: '247 GetObject operations performed within 3 minutes',
        metadata: JSON.stringify({
          bucket: 'prod-customer-data',
          objectsAccessed: 247,
          dataTransferred: '1.2 GB',
        }),
        ipAddresses: JSON.stringify(['185.220.101.42']),
        usernames: JSON.stringify([]),
        files: JSON.stringify([]),
        devices: JSON.stringify([]),
        caseId: case1.id,
      },
      {
        timestamp: new Date('2024-12-20T03:42:05Z'),
        type: 'ALERT',
        source: 'AWS GuardDuty',
        severity: 'CRITICAL',
        title: 'GuardDuty Alert: Exfiltration',
        description: 'Data exfiltration detected from S3 bucket',
        metadata: JSON.stringify({
          alertType: 'Exfiltration:S3/ObjectRead.Unusual',
          confidence: 'High',
        }),
        ipAddresses: JSON.stringify(['185.220.101.42']),
        usernames: JSON.stringify([]),
        files: JSON.stringify([]),
        devices: JSON.stringify([]),
        caseId: case1.id,
      },

      // === Case 2: IoT Camera Botnet events ===
      {
        timestamp: new Date('2024-12-18T14:10:00Z'),
        type: 'NETWORK',
        source: 'Network IDS (Suricata)',
        severity: 'HIGH',
        title: 'Anomalous outbound traffic from IoT VLAN',
        description: 'IP cameras generating 500Mbps outbound traffic to 45.95.169.88 — typical Mirai DDoS pattern',
        metadata: JSON.stringify({
          protocol: 'TCP SYN flood',
          targetIp: '45.95.169.88',
          bandwidth: '500 Mbps',
          sourceDevices: 23,
        }),
        ipAddresses: JSON.stringify(['192.168.1.101', '192.168.1.102', '192.168.1.103', '45.95.169.88']),
        usernames: JSON.stringify([]),
        files: JSON.stringify([]),
        devices: JSON.stringify(['Hikvision DS-2CD2143G2-I', 'Dahua IPC-HDW2431T-AS', 'Reolink RLC-810A']),
        caseId: case2.id,
      },
      {
        timestamp: new Date('2024-12-18T14:22:30Z'),
        type: 'AUTHENTICATION',
        source: 'Camera Management Console',
        severity: 'CRITICAL',
        title: 'Brute-force login to camera admin panel',
        description: 'Successful login after 1,247 failed attempts using default credential dictionary',
        metadata: JSON.stringify({
          failedAttempts: 1247,
          successfulCredential: 'admin:admin123',
          sourceIp: '185.220.101.42',
        }),
        ipAddresses: JSON.stringify(['185.220.101.42', '192.168.1.101']),
        usernames: JSON.stringify(['admin']),
        files: JSON.stringify([]),
        devices: JSON.stringify(['Hikvision DS-2CD2143G2-I']),
        caseId: case2.id,
      },
      {
        timestamp: new Date('2024-12-18T14:35:12Z'),
        type: 'FILE_ACCESS',
        source: 'DVR File System Monitor',
        severity: 'CRITICAL',
        title: 'Malicious binary uploaded to DVR',
        description: 'Binary "dvrHelper" dropped to /tmp/ directory on Dahua DVR via telnet session',
        metadata: JSON.stringify({
          filePath: '/tmp/dvrHelper',
          fileHash: 'sha256:abc123def456...',
          connectionMethod: 'telnet',
          malwareFamily: 'Mirai variant',
        }),
        ipAddresses: JSON.stringify(['192.168.1.150']),
        usernames: JSON.stringify(['root']),
        files: JSON.stringify(['/tmp/dvrHelper', '/tmp/.nttpd']),
        devices: JSON.stringify(['Dahua XVR5108HS-4KL-I3']),
        caseId: case2.id,
      },
      {
        timestamp: new Date('2024-12-18T15:01:44Z'),
        type: 'NETWORK',
        source: 'DNS Sinkhole',
        severity: 'HIGH',
        title: 'Smart speaker contacting C2 domain',
        description: 'Amazon Echo device resolving known malicious domain update.botnet-ctrl.xyz',
        metadata: JSON.stringify({
          domain: 'update.botnet-ctrl.xyz',
          resolvedIp: '45.95.169.88',
          queryCount: 142,
        }),
        ipAddresses: JSON.stringify(['192.168.1.200', '45.95.169.88']),
        usernames: JSON.stringify([]),
        files: JSON.stringify([]),
        devices: JSON.stringify(['Amazon Echo Show 10']),
        caseId: case2.id,
      },
      {
        timestamp: new Date('2024-12-18T16:45:00Z'),
        type: 'ALERT',
        source: 'Smart Lock Cloud API',
        severity: 'HIGH',
        title: 'Unauthorized BLE unlock events',
        description: '8 unauthorized unlock events detected between 02:00-04:00 AM via BLE replay attack',
        metadata: JSON.stringify({
          attackType: 'BLE Replay Attack',
          unlockCount: 8,
          affectedLock: 'Front Door - August Pro',
        }),
        ipAddresses: JSON.stringify([]),
        usernames: JSON.stringify([]),
        files: JSON.stringify([]),
        devices: JSON.stringify(['August Wi-Fi Smart Lock Pro']),
        caseId: case2.id,
      },
      {
        timestamp: new Date('2024-12-18T17:30:22Z'),
        type: 'SYSTEM',
        source: 'MQTT Broker Logs',
        severity: 'MEDIUM',
        title: 'Sensor telemetry data manipulation',
        description: 'Zigbee temperature sensor publishing falsified readings — values outside physical range',
        metadata: JSON.stringify({
          normalRange: '18-26°C',
          reportedValues: [-40, 85, -15, 70],
          mqttTopic: 'zigbee2mqtt/aqara_temp_01',
        }),
        ipAddresses: JSON.stringify(['192.168.1.1']),
        usernames: JSON.stringify([]),
        files: JSON.stringify([]),
        devices: JSON.stringify(['Zigbee Aqara WSDCGQ11LM']),
        caseId: case2.id,
      },
      {
        timestamp: new Date('2024-12-18T18:05:10Z'),
        type: 'NETWORK',
        source: 'Router Firewall Log',
        severity: 'CRITICAL',
        title: 'Router DNS hijacking detected',
        description: 'MikroTik router DNS settings modified to redirect traffic through malicious resolver',
        metadata: JSON.stringify({
          originalDNS: '8.8.8.8',
          maliciousDNS: '45.95.169.88',
          modifiedRules: 12,
        }),
        ipAddresses: JSON.stringify(['192.168.1.1', '45.95.169.88']),
        usernames: JSON.stringify(['admin']),
        files: JSON.stringify(['/system/dns', '/ip/firewall/nat']),
        devices: JSON.stringify(['MikroTik RB4011']),
        caseId: case2.id,
      },

      // === Case 3: Azure Container Registry events ===
      {
        timestamp: new Date('2024-12-19T08:15:00Z'),
        type: 'AUTHENTICATION',
        source: 'Azure AD Sign-in Logs',
        severity: 'HIGH',
        title: 'Suspicious login to Azure subscription',
        description: 'Login from unusual location (IP 103.152.220.44) using compromised service principal',
        metadata: JSON.stringify({
          tenantId: 'tenant-abc-123',
          appId: 'sp-container-push',
          location: 'Vietnam',
        }),
        ipAddresses: JSON.stringify(['103.152.220.44']),
        usernames: JSON.stringify(['sp-container-push@myorg.onmicrosoft.com']),
        files: JSON.stringify([]),
        devices: JSON.stringify([]),
        caseId: case3.id,
      },
      {
        timestamp: new Date('2024-12-19T08:22:33Z'),
        type: 'API_CALL',
        source: 'Azure Activity Log',
        severity: 'CRITICAL',
        title: 'Malicious Docker image pushed to ACR',
        description: 'Docker image pushed to myacr.azurecr.io/backend-api:latest with embedded cryptominer',
        metadata: JSON.stringify({
          registry: 'myacr.azurecr.io',
          image: 'backend-api:latest',
          layers: 14,
          imageSize: '256 MB',
        }),
        ipAddresses: JSON.stringify(['103.152.220.44']),
        usernames: JSON.stringify(['sp-container-push']),
        files: JSON.stringify([]),
        devices: JSON.stringify([]),
        caseId: case3.id,
      },
      {
        timestamp: new Date('2024-12-19T09:00:00Z'),
        type: 'SYSTEM',
        source: 'AKS Cluster Monitoring',
        severity: 'CRITICAL',
        title: 'High CPU usage in production pods',
        description: 'Kubernetes pods running malicious image consuming 95% CPU — XMRig miner active',
        metadata: JSON.stringify({
          clusterName: 'prod-aks-westeu',
          cpuUsage: '95%',
          affectedPods: 6,
          miningPool: 'pool.minexmr.com:443',
        }),
        ipAddresses: JSON.stringify(['10.0.0.15', '10.0.0.16', '10.0.0.17']),
        usernames: JSON.stringify([]),
        files: JSON.stringify(['/usr/local/bin/xmrig']),
        devices: JSON.stringify([]),
        caseId: case3.id,
      },

      // === Case 4: GCP API Key Exposure events ===
      {
        timestamp: new Date('2024-12-17T11:30:00Z'),
        type: 'ALERT',
        source: 'GitHub Secret Scanning',
        severity: 'HIGH',
        title: 'GCP service account key exposed in public repo',
        description: 'GitHub Secret Scanning detected GCP service account key in commit to public repository',
        metadata: JSON.stringify({
          repo: 'dev-team/internal-tools',
          commit: 'a1b2c3d',
          keyType: 'GCP Service Account JSON',
        }),
        ipAddresses: JSON.stringify([]),
        usernames: JSON.stringify(['developer@myorg.com']),
        files: JSON.stringify(['config/gcp-sa-key.json']),
        devices: JSON.stringify([]),
        caseId: case4.id,
      },
      {
        timestamp: new Date('2024-12-17T12:05:00Z'),
        type: 'API_CALL',
        source: 'GCP Audit Logs',
        severity: 'CRITICAL',
        title: 'Unauthorized GCP API calls from multiple regions',
        description: 'Compromised service account key used to list Compute instances and access Cloud Storage from 5 countries',
        metadata: JSON.stringify({
          operations: ['compute.instances.list', 'storage.objects.list', 'iam.serviceAccounts.list'],
          countries: ['Brazil', 'Nigeria', 'India', 'Ukraine', 'China'],
        }),
        ipAddresses: JSON.stringify(['177.54.148.21', '102.89.23.100', '49.37.215.88', '91.193.75.50', '120.232.0.1']),
        usernames: JSON.stringify(['gcp-sa-prod@my-project.iam.gserviceaccount.com']),
        files: JSON.stringify([]),
        devices: JSON.stringify([]),
        caseId: case4.id,
      },
      {
        timestamp: new Date('2024-12-17T13:20:00Z'),
        type: 'NETWORK',
        source: 'GCP VPC Flow Logs',
        severity: 'HIGH',
        title: 'Smart TV on office network accessing GCP APIs',
        description: 'Samsung Smart TV on office WiFi detected making GCP API calls using stolen credentials',
        metadata: JSON.stringify({
          deviceModel: 'Samsung QN85B Neo QLED',
          networkSSID: 'CorpOffice-5G',
          apiCalls: 34,
        }),
        ipAddresses: JSON.stringify(['192.168.10.55']),
        usernames: JSON.stringify([]),
        files: JSON.stringify([]),
        devices: JSON.stringify(['Samsung QN85B Neo QLED']),
        caseId: case4.id,
      },
    ],
  });

  console.log('✅ Created 17 timeline events across all cases');

  // Обновление статистики дел
  console.log('\n📊 Updating case statistics...');

  await Promise.all([
    prisma.case.update({
      where: { id: case1.id },
      data: {
        evidenceCount: 3,
        eventsCount: 4,
        suspiciousActivities: 3,
      },
    }),
    prisma.case.update({
      where: { id: case2.id },
      data: {
        evidenceCount: 6,
        eventsCount: 7,
        suspiciousActivities: 6,
      },
    }),
    prisma.case.update({
      where: { id: case3.id },
      data: {
        evidenceCount: 2,
        eventsCount: 3,
        suspiciousActivities: 2,
      },
    }),
    prisma.case.update({
      where: { id: case4.id },
      data: {
        evidenceCount: 1,
        eventsCount: 3,
        suspiciousActivities: 2,
      },
    }),
  ]);

  console.log('✅ Updated case statistics');

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Seed completed successfully!');
  console.log('='.repeat(60));
  console.log('\n📝 Test credentials:');
  console.log('   Email: analyst@forensics.io');
  console.log('   Password: REDACTED-ROTATE-SEED-PASSWORD');
  console.log('\n   Email: admin@forensics.io');
  console.log('   Password: REDACTED-ROTATE-SEED-PASSWORD');
  console.log('\n📁 Demo Case IDs (use these in your tests):');
  console.log(`   - Case 1 (AWS S3): ${DEMO_IDS.cases.case1}`);
  console.log(`   - Case 2 (IoT): ${DEMO_IDS.cases.case2}`);
  console.log(`   - Case 3 (Azure): ${DEMO_IDS.cases.case3}`);
  console.log(`   - Case 4 (GCP): ${DEMO_IDS.cases.case4}`);
  console.log('\n💡 Quick test URL:');
  console.log(`   http://localhost:3000/cases/${DEMO_IDS.cases.case1}`);
  console.log('='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
