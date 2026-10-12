/**
 * Verification Test: Simplified Direct Registration without Email Verification or Transactional Emails
 */

const BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('🚀 ZETATHON Simplified Registration & Admin Workflow Test');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
      failed++;
    }
  }

  const runId = Date.now().toString(36);
  const testTeamName = `QuantumForge_${runId}`;
  const testLeaderEmail = `leader_${runId}@dce.ac.in`;
  const testMemberEmail = `member_${runId}@dce.ac.in`;
  let registeredTeam = null;
  let adminToken = null;

  // 1. Health check
  await test('Backend Health Check', async () => {
    const res = await fetch(`${BASE}/health`).then(r => r.json());
    if (res.status !== 'healthy') throw new Error('Backend not healthy');
  });

  // 2. Direct Registration with PPT Deck (Multipart / FormData)
  await test('Direct Registration with PPT (No OTP, No Email Verification)', async () => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    // Create valid PDF mock buffer (%PDF-1.4 header)
    const pdfHeader = Buffer.from('%PDF-1.4\n%Mock PPT deck for Zetathon Hackathon\n%%EOF');

    const membersJson = JSON.stringify([
      {
        name: 'Sarah Connor',
        email: testMemberEmail,
        phone: '9876543211',
        college: 'Dronacharya College of Engineering',
        department: 'Computer Science & Engineering',
        year: '3rd Year',
      },
    ]);

    // Build multipart/form-data body
    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="teamName"\r\n\r\n${testTeamName}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="leaderName"\r\n\r\nJohn Matrix\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="leaderEmail"\r\n\r\n${testLeaderEmail}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="phone"\r\n\r\n9876543210\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="college"\r\n\r\nDronacharya College of Engineering\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="department"\r\n\r\nComputer Science & Engineering\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="year"\r\n\r\n3rd Year\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="challengeId"\r\n\r\nopen-innovation\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="members"\r\n\r\n${membersJson}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="pptFile"; filename="QuantumForge_Pitch.pdf"\r\nContent-Type: application/pdf\r\n\r\n`,
    ];

    const bodyBuffer = Buffer.concat([
      Buffer.from(parts.slice(0, -1).join('')),
      Buffer.from(parts[parts.length - 1]),
      pdfHeader,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const res = await fetch(`${BASE}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: bodyBuffer,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Direct registration failed');
    }

    if (!data.team) throw new Error('Expected team object in registration response');
    if (!data.registrationId || !data.registrationId.startsWith('ZETA-2026-')) {
      throw new Error(`Unexpected registration ID format: ${data.registrationId}`);
    }
    if (!data.message.includes('Registration submitted successfully')) {
      throw new Error(`Unexpected success message: ${data.message}`);
    }
    if (!data.team.pptFile || data.team.pptFile.originalName !== 'QuantumForge_Pitch.pdf') {
      throw new Error('PPT file metadata was not preserved');
    }

    registeredTeam = data.team;
    console.log(`    -> Registered Team ID: ${registeredTeam.id}, Reg ID: ${data.registrationId}`);
  });

  // 3. Duplicate Registration Prevention
  await test('Duplicate Team Name Prevention', async () => {
    const payload = {
      teamName: testTeamName,
      leaderName: 'Another Leader',
      leaderEmail: `another.${runId}@dce.ac.in`,
      phone: '9876543222',
      college: 'DCE',
      department: 'CSE',
      year: '3rd Year',
      members: [
        {
          name: 'Member 2',
          email: `m2.${runId}@dce.ac.in`,
        },
      ],
    };

    const res = await fetch(`${BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.status !== 409) {
      throw new Error(`Expected 409 conflict, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // 4. Duplicate Leader Email Prevention
  await test('Duplicate Leader Email Prevention', async () => {
    const payload = {
      teamName: `UniqueName_${runId}`,
      leaderName: 'John Matrix',
      leaderEmail: testLeaderEmail, // Already registered
      phone: '9876543222',
      college: 'DCE',
      department: 'CSE',
      year: '3rd Year',
      members: [
        {
          name: 'Member 2',
          email: `unique_m2.${runId}@dce.ac.in`,
        },
      ],
    };

    const res = await fetch(`${BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.status !== 409) {
      throw new Error(`Expected 409 conflict for duplicate email, got ${res.status}`);
    }
  });

  // 5. Admin Authentication
  await test('Official Admin Login (zeta.ecell.dce@gmail.com)', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'zeta.ecell.dce@gmail.com',
        password: 'zetadce2444666668888888',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.token) {
      throw new Error('Admin login failed: ' + (data.error || res.statusText));
    }
    adminToken = data.token;
  });

  // 6. Admin Dashboard - Team Visibility
  await test('Admin Views Registered Team in Dashboard', async () => {
    const res = await fetch(`${BASE}/admin/teams`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (!res.ok || !data.teams) throw new Error('Failed to retrieve admin teams list');

    const found = data.teams.find(t => t.id === registeredTeam.id || t.name === testTeamName);
    if (!found) {
      throw new Error(`Newly registered team "${testTeamName}" not found in admin teams list`);
    }
    if (!found.pptFile) {
      throw new Error('Team in admin dashboard is missing PPT metadata');
    }
    console.log(`    -> Found team in admin list: ${found.name} (Status: ${found.status})`);
  });

  // 7. Admin Shortlist Status Update (No Emails Sent)
  await test('Admin Updates Selection Status to Shortlisted (No Emails)', async () => {
    const res = await fetch(`${BASE}/admin/teams/${registeredTeam.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'shortlisted',
        reason: 'Selected for top-tier problem track execution.',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success || data.team?.status !== 'shortlisted') {
      throw new Error(`Failed to update status to shortlisted: ${JSON.stringify(data)}`);
    }
    console.log('    -> Status updated to shortlisted successfully without error');
  });

  // 8. Admin PPT Download
  await test('Admin Downloads Uploaded PPT Presentation Deck', async () => {
    const res = await fetch(`${BASE}/admin/teams/${registeredTeam.id}/ppt`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (!res.ok) {
      throw new Error(`PPT download failed with status ${res.status}`);
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0) {
      throw new Error('Downloaded PPT file buffer is empty');
    }
    console.log(`    -> PPT downloaded: ${buffer.byteLength} bytes received`);
  });

  // 9. Admin Updates Status to Waitlisted and Not Shortlisted
  await test('Admin Status Transitions (Waitlisted / Not Shortlisted)', async () => {
    // Waitlist
    const resWait = await fetch(`${BASE}/admin/teams/${registeredTeam.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'waitlisted',
        reason: 'Placed in reserve pool.',
      }),
    });
    const dataWait = await resWait.json();
    if (!resWait.ok || dataWait.team?.status !== 'waitlisted') {
      throw new Error('Failed to update status to waitlisted');
    }

    // Not Shortlisted
    const resNot = await fetch(`${BASE}/admin/teams/${registeredTeam.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'not_shortlisted',
        reason: 'Evaluated for round 1.',
      }),
    });
    const dataNot = await resNot.json();
    if (!resNot.ok || dataNot.team?.status !== 'not_shortlisted') {
      throw new Error('Failed to update status to not_shortlisted');
    }
  });

  // 10. Admin Overview Stats Count
  await test('Admin Overview Stats Accurately Counts PPT and Teams', async () => {
    const res = await fetch(`${BASE}/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (!res.ok || !data.data) throw new Error('Failed to get overview stats');
    if (data.data.totalTeams < 1) throw new Error('Expected at least 1 total team in overview');
    if (data.data.pptSubmissions < 1) throw new Error('Expected at least 1 PPT submission in overview');
    console.log(`    -> Overview: Total Teams = ${data.data.totalTeams}, PPTs = ${data.data.pptSubmissions}`);
  });

  console.log('\n================================================================');
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
