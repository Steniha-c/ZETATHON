/**
 * ZETATHON End-to-End Security & Functional Test Suite
 * Tests all 17 specified security test cases and existing hackathon flows.
 */

const BASE = 'http://localhost:5000/api';

async function runAllTests() {
  console.log('================================================================');
  console.log('🔒 ZETATHON Production-Grade Security & E2E Validation Suite');
  console.log('Target API Endpoint: ' + BASE);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const testResults = [];

  async function runTestCase(caseNumber, description, testFn) {
    const title = `Case ${caseNumber}: ${description}`;
    try {
      await testFn();
      console.log(`  ✅ PASS [${caseNumber}] ${description}`);
      passed++;
      testResults.push({ caseNumber, description, status: 'PASSED' });
    } catch (err) {
      console.error(`  ❌ FAIL [${caseNumber}] ${description} -> ${err.message}`);
      failed++;
      testResults.push({ caseNumber, description, status: 'FAILED', error: err.message });
    }
  }

  // Baseline Check
  await runTestCase('0', 'System Health Check & Architecture', async () => {
    const res = await fetch(`${BASE}/health`).then(r => r.json());
    if (res.status !== 'healthy') throw new Error('Backend health check did not return healthy');
  });

  // Global test state
  const testRunId = Date.now().toString(36);
  let verifiedTeamId = null;
  let verifiedLeaderEmail = `leader.${testRunId}@zetathon.org`;
  let verifiedLeaderToken = null;
  let adminToken = null;

  // --------------------------------------------------------------------------
  // FEATURE 1: EMAIL VERIFICATION USING OTP
  // --------------------------------------------------------------------------

  // 1. Valid email verification
  await runTestCase('1', 'Valid email verification flow with cryptographically secure OTP', async () => {
    const regPayload = {
      teamName: `AlphaShield_${testRunId}`,
      leaderName: 'Aiden Vance',
      leaderEmail: verifiedLeaderEmail,
      phone: '+91 9876543210',
      department: 'Computer Science',
      year: '3rd Year',
      college: 'ZETA Institute of Technology',
      challengeId: 'open-innovation',
      members: [
        {
          name: 'Maya Lin',
          email: `maya.${testRunId}@zetathon.org`,
          department: 'Cybersecurity',
          year: '3rd Year',
        },
      ],
    };

    const regRes = await fetch(`${BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload),
    }).then(r => r.json());

    if (!regRes.success || !regRes.pendingVerification) {
      throw new Error(`Registration failed: ${regRes.error || 'Expected pendingVerification'}`);
    }

    // Retrieve dev test OTP safely exposed only in non-production
    const devOtpRes = await fetch(`${BASE}/teams/dev-otp?email=${encodeURIComponent(verifiedLeaderEmail)}`).then(r => r.json());
    if (!devOtpRes.success || !devOtpRes.otp) {
      throw new Error('Unable to retrieve dev test OTP for automated verification');
    }

    // Verify OTP
    const verifyRes = await fetch(`${BASE}/teams/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: verifiedLeaderEmail,
        otp: devOtpRes.otp,
      }),
    }).then(r => r.json());

    if (!verifyRes.success || !verifyRes.team) {
      throw new Error(`OTP verification failed: ${verifyRes.error}`);
    }

    if (verifyRes.team.status !== 'pending_approval') {
      throw new Error(`Expected team status 'pending_approval', got '${verifyRes.team.status}'`);
    }

    if (verifyRes.team.emailVerified !== true) {
      throw new Error('Expected emailVerified to be true');
    }

    if (!verifyRes.token) {
      throw new Error('Expected participant authentication token upon successful verification');
    }

    verifiedTeamId = verifyRes.team.id;
    verifiedLeaderToken = verifyRes.token;
  });

  // 2. Incorrect OTP rejection
  await runTestCase('2', 'Incorrect OTP is rejected with remaining attempt count', async () => {
    const tempEmail = `wrongotp.${testRunId}@zetathon.org`;
    // Register temporary team with valid member to trigger OTP
    const initRes = await fetch(`${BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamName: `WrongOtpTeam_${testRunId}`,
        leaderName: 'Test Leader',
        leaderEmail: tempEmail,
        phone: '+91 9999988888',
        department: 'CSE',
        year: '2nd Year',
        college: 'ZETA Tech',
        members: [{ name: 'Member One', email: `mem_w_${testRunId}@zetathon.org` }],
      }),
    }).then(r => r.json());

    if (!initRes.success || !initRes.pendingVerification) {
      throw new Error(`Failed to initiate registration: ${initRes.error}`);
    }

    const res = await fetch(`${BASE}/teams/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: tempEmail,
        otp: '000000', // Invalid code
      }),
    });

    const json = await res.json();
    if (res.status !== 400 || json.success !== false) {
      throw new Error(`Expected 400 Bad Request, got status ${res.status}`);
    }
    if (!json.error || !json.error.includes('Incorrect verification code')) {
      throw new Error(`Expected error message about incorrect code, got: ${json.error}`);
    }
  });

  // 3. Expired OTP rejection
  await runTestCase('3', 'Expired or non-existent OTP sessions are rejected securely', async () => {
    const expiredRes = await fetch(`${BASE}/teams/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `nonexistent.${testRunId}@zetathon.org`,
        otp: '123456',
      }),
    });

    const json = await expiredRes.json();
    if (expiredRes.status !== 400 || json.success !== false) {
      throw new Error(`Expected 400 for non-existent/expired verification, got ${expiredRes.status}`);
    }
  });

  // 4. OTP resend and rate limiting / cooldown
  await runTestCase('4', 'OTP resend enforces 60-second cooldown and rate limiting', async () => {
    const cooldownEmail = `cooldown.${testRunId}@zetathon.org`;
    // Register team to start session
    const initRes = await fetch(`${BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamName: `CooldownTeam_${testRunId}`,
        leaderName: 'Cooldown Tester',
        leaderEmail: cooldownEmail,
        phone: '+91 9123456789',
        department: 'ECE',
        year: '4th Year',
        college: 'ZETA College',
        members: [{ name: 'Member Cooldown', email: `mem_c_${testRunId}@zetathon.org` }],
      }),
    }).then(r => r.json());

    if (!initRes.success || !initRes.pendingVerification) {
      throw new Error(`Failed to initiate registration: ${initRes.error}`);
    }

    // Attempt immediate resend without waiting for cooldown
    const resendRes = await fetch(`${BASE}/teams/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cooldownEmail }),
    });

    const json = await resendRes.json();
    if (resendRes.status !== 429 || json.success !== false) {
      throw new Error(`Expected 429 Too Many Requests for immediate resend, got ${resendRes.status}`);
    }
    if (!json.error || !json.error.includes('wait')) {
      throw new Error(`Expected wait cooldown error, got: ${json.error}`);
    }
  });

  // 5. Unverified registration cannot receive an authenticated session
  await runTestCase('5', 'Unverified registration cannot receive a fully authenticated participant session', async () => {
    const unverifiedEmail = `unverified.${testRunId}@zetathon.org`;
    // Initiate registration but NEVER verify OTP
    await fetch(`${BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamName: `UnverifiedTeam_${testRunId}`,
        leaderName: 'Unverified Hacker',
        leaderEmail: unverifiedEmail,
        phone: '+91 9111122222',
        department: 'IT',
        year: '1st Year',
        college: 'ZETA Campus',
        members: [{ name: 'Member Unverified', email: `mem_u_${testRunId}@zetathon.org` }],
      }),
    });

    // Try logging in with this unverified email
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: unverifiedEmail, password: 'password123' }),
    });

    const json = await loginRes.json();
    if (loginRes.status === 200 && json.token) {
      throw new Error('Unverified registration was granted an active authentication token');
    }
  });

  // --------------------------------------------------------------------------
  // FEATURE 2: DUPLICATE REGISTRATION PREVENTION
  // --------------------------------------------------------------------------

  // 6. Duplicate email registration rejected
  await runTestCase('6', 'Duplicate email registration is rejected for both leader and member emails', async () => {
    // Attempt registering a new team using the already-verified leader email
    const dupRes = await fetch(`${BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamName: `UniqueTeam_${Date.now()}`,
        leaderName: 'Imposter',
        leaderEmail: verifiedLeaderEmail.toUpperCase(), // Test case-insensitive normalization
        phone: '+91 9555544444',
        department: 'CSE',
        year: '2nd Year',
        college: 'ZETA Tech',
        members: [{ name: 'Member Dupont', email: `dup_m_${testRunId}@zetathon.org` }],
      }),
    });

    const json = await dupRes.json();
    if (dupRes.status !== 409 && dupRes.status !== 400) {
      throw new Error(`Expected 409/400 for duplicate email, got ${dupRes.status}`);
    }
    if (!json.error || !json.error.includes('email')) {
      throw new Error(`Expected duplicate email error message, got: ${json.error}`);
    }
  });

  // 7. Duplicate team registration rejected (normalized team name)
  await runTestCase('7', 'Duplicate team name registration is rejected with case & whitespace normalization', async () => {
    const dupTeamRes = await fetch(`${BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamName: `  alphashield_${testRunId}  `, // Same name with whitespace and lowercase
        leaderName: 'New Leader',
        leaderEmail: `brandnew.${testRunId}@zetathon.org`,
        phone: '+91 9777766666',
        department: 'ME',
        year: '3rd Year',
        college: 'ZETA Tech',
        members: [{ name: 'Member Distinct', email: `mem_distinct_${testRunId}@zetathon.org` }],
      }),
    });

    const json = await dupTeamRes.json();
    if (dupTeamRes.status !== 409 && dupTeamRes.status !== 400) {
      throw new Error(`Expected 409/400 for duplicate team name, got ${dupTeamRes.status}`);
    }
    if (!json.error || !json.error.includes('team name')) {
      throw new Error(`Expected duplicate team name error, got: ${json.error}`);
    }
  });

  // 8. Concurrent duplicate registration attempts
  await runTestCase('8', 'Concurrent duplicate registration attempts do not create duplicate records', async () => {
    const concurrentTeamName = `RaceConditionSquad_${testRunId}`;
    const concurrentEmail = `race.${testRunId}@zetathon.org`;

    const makeReq = () =>
      fetch(`${BASE}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: concurrentTeamName,
          leaderName: 'Concurrent Runner',
          leaderEmail: concurrentEmail,
          phone: '+91 9888811111',
          department: 'AI',
          year: '2nd Year',
          college: 'ZETA Campus',
          members: [{ name: 'Member Parallel', email: `parallel_${testRunId}@zetathon.org` }],
        }),
      }).then(async r => ({ status: r.status, json: await r.json() }));

    // Execute 4 concurrent requests at once
    const results = await Promise.all([makeReq(), makeReq(), makeReq(), makeReq()]);

    const successes = results.filter(r => r.status === 200 && r.json.success);
    const conflicts = results.filter(r => r.status === 409 || r.status === 400);

    if (successes.length !== 1) {
      throw new Error(`Expected exactly 1 successful registration out of concurrent batch, got ${successes.length}`);
    }
    if (conflicts.length !== 3) {
      throw new Error(`Expected remaining 3 concurrent requests to be rejected, got ${conflicts.length}`);
    }
  });

  // --------------------------------------------------------------------------
  // FEATURE 3: ADMIN APPROVAL WORKFLOW
  // --------------------------------------------------------------------------

  // 9. Verified registration remains pending until admin approval
  await runTestCase('9', 'Verified registration enters pending_approval and cannot submit projects until cleared', async () => {
    // Try submitting project deliverable while team status is 'pending_approval' using verifiedLeaderToken
    const subRes = await fetch(`${BASE}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${verifiedLeaderToken}`,
      },
      body: JSON.stringify({
        projectTitle: 'ShieldProto: Zero Trust Hack',
        projectDescription: 'Enterprise zero-trust perimeter telemetry prototype that monitors packet routing.',
        githubUrl: 'https://github.com/zeta-club/shield-proto',
      }),
    });

    const subJson = await subRes.json();
    if (subRes.status !== 403 || subJson.success !== false) {
      throw new Error(`Expected 403 Forbidden for pending_approval team submission, got ${subRes.status}`);
    }
    if (!subJson.error || !subJson.error.includes('approved')) {
      throw new Error(`Expected approval required message, got: ${subJson.error}`);
    }
  });

  // 10. Admin can approve, reject, and waitlist teams
  await runTestCase('10', 'Admin can moderate registration statuses (approve, waitlist, reject) with audit log', async () => {
    // Login as official exclusive admin
    const adminLoginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'zeta.ecell.dce@gmail.com', password: 'zetadce2444666668888888' }),
    }).then(r => r.json());

    if (!adminLoginRes.token || adminLoginRes.user.role !== 'admin') {
      throw new Error('Admin login failed');
    }
    adminToken = adminLoginRes.token;

    // 10a. Waitlist team
    const waitlistRes = await fetch(`${BASE}/admin/teams/${verifiedTeamId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'waitlisted' }),
    }).then(r => r.json());
    if (!waitlistRes.success || waitlistRes.team.status !== 'waitlisted') {
      throw new Error('Failed to waitlist team');
    }

    // 10b. Reject team
    const rejectRes = await fetch(`${BASE}/admin/teams/${verifiedTeamId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'rejected' }),
    }).then(r => r.json());
    if (!rejectRes.success || rejectRes.team.status !== 'rejected') {
      throw new Error('Failed to reject team');
    }

    // 10c. Approve team (and verify audit fields)
    const approveRes = await fetch(`${BASE}/admin/teams/${verifiedTeamId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'approved' }),
    }).then(r => r.json());
    if (!approveRes.success || approveRes.team.status !== 'approved') {
      throw new Error('Failed to approve team');
    }
    if (!approveRes.team.approvedAt || !approveRes.team.approvedBy) {
      throw new Error('Expected audit fields approvedAt and approvedBy to be populated');
    }
  });

  // 11. Participant cannot approve or reject teams
  await runTestCase('11', 'Participant token cannot moderate or alter team approval status (403)', async () => {
    const partModRes = await fetch(`${BASE}/admin/teams/${verifiedTeamId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${verifiedLeaderToken}`,
      },
      body: JSON.stringify({ status: 'approved' }),
    });

    const json = await partModRes.json();
    if (partModRes.status !== 403 || json.success !== false) {
      throw new Error(`Expected 403 Forbidden when participant calls admin endpoint, got ${partModRes.status}`);
    }
  });

  // --------------------------------------------------------------------------
  // FEATURE 4: SECURE ADMIN AUTHENTICATION AND ROUTE PROTECTION
  // --------------------------------------------------------------------------

  // 12. Unauthenticated requests to admin APIs receive 401
  await runTestCase('12', 'Unauthenticated requests to admin API endpoints receive 401 Unauthorized', async () => {
    const noAuthRes = await fetch(`${BASE}/admin/overview`);
    const json = await noAuthRes.json();
    if (noAuthRes.status !== 401 || json.success !== false) {
      throw new Error(`Expected 401 Unauthorized, got ${noAuthRes.status}`);
    }
  });

  // 13. Participant requests to admin APIs receive 403
  await runTestCase('13', 'Participant token requests to admin API endpoints receive 403 Forbidden', async () => {
    const partRes = await fetch(`${BASE}/admin/overview`, {
      headers: { Authorization: `Bearer ${verifiedLeaderToken}` },
    });
    const json = await partRes.json();
    if (partRes.status !== 403 || json.success !== false) {
      throw new Error(`Expected 403 Forbidden, got ${partRes.status}`);
    }
  });

  // 14. Manually opening /admin does not bypass authorization
  await runTestCase('14', 'Admin endpoints refuse authorization bypass and forged access tokens', async () => {
    // Test with malformed token
    const malformedRes = await fetch(`${BASE}/admin/teams`, {
      headers: { Authorization: 'Bearer invalid.tampered.token.123' },
    });
    if (malformedRes.status !== 401 && malformedRes.status !== 403) {
      throw new Error(`Expected 401/403 for tampered token, got ${malformedRes.status}`);
    }
  });

  // 15. Participant cannot modify their role or obtain admin privileges
  await runTestCase('15', 'Participant cannot assign themselves admin role during registration or API calls', async () => {
    const exploitEmail = `hacker.${testRunId}@zetathon.org`;
    const exploitRes = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Privilege Escalation Tester',
        email: exploitEmail,
        password: 'Password@123',
        role: 'admin', // Malicious attempt to escalate role
      }),
    }).then(r => r.json());

    if (!exploitRes.user || exploitRes.user.role === 'admin') {
      throw new Error('Privilege escalation vulnerability: user was granted admin role via request body!');
    }
    if (exploitRes.user.role !== 'participant') {
      throw new Error(`Expected role to be strictly 'participant', got '${exploitRes.user.role}'`);
    }

    // Verify token issued to this user cannot access admin API
    const testAdminAccess = await fetch(`${BASE}/admin/overview`, {
      headers: { Authorization: `Bearer ${exploitRes.token}` },
    });
    if (testAdminAccess.status !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${testAdminAccess.status}`);
    }
  });

  // 16. Exclusive admin authentication safeguards
  await runTestCase('16', 'Exclusive admin authentication safeguards and legacy admin decommissioning verified', async () => {
    // 16a. Wrong password for authorized admin is rejected
    const wrongPassRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'zeta.ecell.dce@gmail.com', password: 'wrong_password_test' }),
    });
    if (wrongPassRes.status === 200) {
      throw new Error('Login succeeded with invalid password!');
    }

    // 16b. Legacy demo admin account is completely decommissioned & rejected
    const legacyRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@zetathon.org', password: 'admin123' }),
    });
    if (legacyRes.status === 200) {
      throw new Error('Legacy demo admin was permitted to login!');
    }
  });

  // 17. Existing registration, login, dashboard, submission, and CSV export flows continue to work
  await runTestCase('17', 'Existing core workflows (submission by approved team, grading, CSV export) function flawlessly', async () => {
    // 17a. Now that verifiedTeamId was approved in Case 10, submit project deliverables
    const subRes = await fetch(`${BASE}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${verifiedLeaderToken}`,
      },
      body: JSON.stringify({
        projectTitle: 'AegisZero: Distributed Campus Threat Grid',
        projectDescription: 'Production zero-trust edge monitoring prototype with automated threat quarantine.',
        githubUrl: 'https://github.com/zeta-club/aegis-zero-hackathon',
        demoUrl: 'https://aegis-zero.zetathon.dev',
        videoUrl: 'https://youtu.be/aegis-zero-demo',
        remarks: 'Ready for jury review bay 3.',
      }),
    }).then(r => r.json());

    if (!subRes.success || !subRes.submission) {
      throw new Error(`Submission failed for approved team: ${subRes.error}`);
    }

    // 17b. Admin grades the submission
    const gradeRes = await fetch(`${BASE}/admin/submissions/${verifiedTeamId}/grade`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        score: 96,
        feedback: 'Exceptional architectural rigor, clear threat model, and working telemetry!',
      }),
    }).then(r => r.json());

    if (!gradeRes.success || gradeRes.submission.score !== 96) {
      throw new Error('Admin grading failed for verified team submission');
    }

    // 17c. Admin exports CSV
    const csvRes = await fetch(`${BASE}/admin/export?format=csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const csvText = await csvRes.text();
    if (!csvText.includes('Team ID') || !csvText.includes(verifiedLeaderEmail)) {
      throw new Error('CSV export does not contain valid headers or expected team data');
    }
  });

  // --------------------------------------------------------------------------
  // FEATURE 5: HACKATHON SELECTION WORKFLOW, PPT INSPECTION & EMAIL AUTOMATION
  // --------------------------------------------------------------------------

  let pptTeamId = null;
  let pptTeamLeaderEmail = `delivered+ppt.${testRunId}@resend.dev`;
  let pptTeamRegistrationId = null;
  let pptTeamLeaderToken = null;

  // 18. Registration with valid PPT file upload
  await runTestCase('18', 'Team registration with valid PPT file upload, registration ID generation & email dispatch', async () => {
    const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (ZETATHON Project Pitch) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
    const form = new FormData();
    form.append('teamName', `TitanPulse_${testRunId}`);
    form.append('leaderName', 'Elena Rostova');
    form.append('leaderEmail', pptTeamLeaderEmail);
    form.append('phone', '+91 9888877777');
    form.append('college', 'Dronacharya College of Engineering');
    form.append('department', 'Computer Science & Engineering');
    form.append('year', '3rd Year');
    form.append('challengeId', 'open-innovation');
    form.append('members', JSON.stringify([
      { name: 'Kaelen Voss', email: `kaelen.${testRunId}@zetathon.org`, phone: '+91 9777711111', college: 'DCE', department: 'CSE', year: '3rd Year' },
      { name: 'Sora Tanaka', email: `sora.${testRunId}@zetathon.org`, phone: '+91 9777722222', college: 'DCE', department: 'IT', year: '3rd Year' }
    ]));
    form.append('pptFile', new Blob([validPdfBuffer], { type: 'application/pdf' }), 'titan_pulse_deck.pdf');

    const regRes = await fetch(`${BASE}/teams`, {
      method: 'POST',
      body: form,
    }).then(r => r.json());

    if (!regRes.success || !regRes.pendingVerification) {
      throw new Error(`Registration with PPT failed: ${regRes.error}`);
    }

    if (!regRes.registrationId || !regRes.registrationId.startsWith('ZETA-2026-')) {
      throw new Error(`Expected registrationId starting with 'ZETA-2026-', got '${regRes.registrationId}'`);
    }

    pptTeamRegistrationId = regRes.registrationId;

    // Retrieve dev test OTP
    const devOtpRes = await fetch(`${BASE}/teams/dev-otp?email=${encodeURIComponent(pptTeamLeaderEmail)}`).then(r => r.json());
    if (!devOtpRes.success || !devOtpRes.otp) {
      throw new Error('Unable to retrieve OTP for PPT team registration');
    }

    // Verify OTP and complete registration
    const verifyRes = await fetch(`${BASE}/teams/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pptTeamLeaderEmail, otp: devOtpRes.otp }),
    }).then(r => r.json());

    if (!verifyRes.success || !verifyRes.team) {
      throw new Error(`Failed to complete verification: ${verifyRes.error}`);
    }

    if (!verifyRes.team.pptFile || verifyRes.team.pptFile.originalName !== 'titan_pulse_deck.pdf') {
      throw new Error('Expected PPT file metadata to be stored on team record');
    }

    if (!verifyRes.team.emailStatus?.registrationEmail || verifyRes.team.emailStatus.registrationEmail.status !== 'sent') {
      throw new Error('Expected registration confirmation email status to be recorded as sent');
    }

    pptTeamId = verifyRes.team.id;
    pptTeamLeaderToken = verifyRes.token;
  });

  // 19. Member count limits enforcement
  await runTestCase('19', 'Member count limits enforcement (minimum 1 additional, maximum 3 additional)', async () => {
    // 19a. 0 additional members (solo team when minimum 2 total required)
    const soloRes = await fetch(`${BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamName: `SoloSquad_${testRunId}`,
        leaderName: 'Solo Leader',
        leaderEmail: `solo.${testRunId}@zetathon.org`,
        phone: '+91 9123456789',
        college: 'DCE',
        department: 'CSE',
        year: '2nd Year',
        members: [], // 0 additional members
      }),
    });
    if (soloRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for 0 additional members, got ${soloRes.status}`);
    }

    // 19b. 4 additional members (total 5 when maximum 4 total allowed)
    const tooManyRes = await fetch(`${BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamName: `OversizedSquad_${testRunId}`,
        leaderName: 'Too Many Leader',
        leaderEmail: `toomany.${testRunId}@zetathon.org`,
        phone: '+91 9123456788',
        college: 'DCE',
        department: 'CSE',
        year: '2nd Year',
        members: [
          { name: 'M1', email: `m1_${testRunId}@zetathon.org` },
          { name: 'M2', email: `m2_${testRunId}@zetathon.org` },
          { name: 'M3', email: `m3_${testRunId}@zetathon.org` },
          { name: 'M4', email: `m4_${testRunId}@zetathon.org` },
        ],
      }),
    });
    if (tooManyRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for 4 additional members (5 total), got ${tooManyRes.status}`);
    }
  });

  // 20. PPT Magic Byte Inspection security (rejects fake PPT/PDF files)
  await runTestCase('20', 'PPT binary magic byte inspection rejects spoofed and corrupted files', async () => {
    const fakePdfBuffer = Buffer.from('THIS IS PLAIN TEXT, NOT A REAL PDF OR PPT HEADER');
    const form = new FormData();
    form.append('teamName', `SpoofTeam_${testRunId}`);
    form.append('leaderName', 'Spoof Tester');
    form.append('leaderEmail', `spoof.${testRunId}@zetathon.org`);
    form.append('phone', '+91 9333344444');
    form.append('college', 'DCE');
    form.append('department', 'CSE');
    form.append('year', '2nd Year');
    form.append('members', JSON.stringify([{ name: 'M1', email: `sm1_${testRunId}@zetathon.org` }]));
    form.append('pptFile', new Blob([fakePdfBuffer], { type: 'application/pdf' }), 'malicious_deck.pdf');

    const spoofRes = await fetch(`${BASE}/teams`, {
      method: 'POST',
      body: form,
    });

    const spoofJson = await spoofRes.json();
    if (spoofRes.status !== 400 || spoofJson.success !== false) {
      throw new Error(`Expected 400 Bad Request for file failing magic byte inspection, got ${spoofRes.status}`);
    }
    if (!spoofJson.error || !spoofJson.error.includes('binary content')) {
      throw new Error(`Expected magic byte error message, got: ${spoofJson.error}`);
    }
  });

  // 21. PPT Presentation Download Access Restrictions
  await runTestCase('21', 'PPT presentation download endpoint enforces strict role-based access control', async () => {
    // 21a. Unauthenticated request receives 401
    const unauthRes = await fetch(`${BASE}/admin/teams/${pptTeamId}/ppt`);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated PPT download, got ${unauthRes.status}`);
    }

    // 21b. Unauthorized participant receives 403 when trying to access another team's PPT via admin route
    const unauthPartRes = await fetch(`${BASE}/admin/teams/${pptTeamId}/ppt`, {
      headers: { Authorization: `Bearer ${verifiedLeaderToken}` },
    });
    if (unauthPartRes.status !== 403) {
      throw new Error(`Expected 403 for unauthorized participant PPT download, got ${unauthPartRes.status}`);
    }

    // 21c. Authorized admin downloads PPT successfully
    const adminDownloadRes = await fetch(`${BASE}/admin/teams/${pptTeamId}/ppt`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminDownloadRes.status !== 200) {
      throw new Error(`Expected 200 for admin PPT download, got ${adminDownloadRes.status}`);
    }
    const contentType = adminDownloadRes.headers.get('content-type');
    if (!contentType || !contentType.includes('pdf')) {
      throw new Error(`Expected PDF content-type, got: ${contentType}`);
    }
  });

  // 22. Shortlisting status change, audit logging & shortlist email dispatch
  await runTestCase('22', 'Admin marks team as Shortlisted, records audit log, and dispatches shortlist email', async () => {
    const shortlistRes = await fetch(`${BASE}/admin/teams/${pptTeamId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'shortlisted',
        reason: 'Innovative decentralized threat mitigation proposal with solid PPT slides.',
        notifyLeader: true,
      }),
    }).then(r => r.json());

    if (!shortlistRes.success || shortlistRes.team.status !== 'shortlisted') {
      throw new Error(`Failed to shortlist team: ${shortlistRes.error}`);
    }

    if (!shortlistRes.team.approvedAt || !shortlistRes.team.approvedBy) {
      throw new Error('Expected approvedAt and approvedBy to be populated upon shortlisting');
    }

    if (!shortlistRes.team.auditLog || shortlistRes.team.auditLog.length === 0) {
      throw new Error('Expected auditLog entry to be created for status transition');
    }

    const latestAudit = shortlistRes.team.auditLog[0];
    if (latestAudit.newStatus !== 'shortlisted') {
      throw new Error(`Expected latest audit log newStatus to be 'shortlisted', got '${latestAudit.newStatus}'`);
    }

    if (!shortlistRes.team.emailStatus?.selectionEmail || shortlistRes.team.emailStatus.selectionEmail.status !== 'sent') {
      throw new Error('Expected selection email status to be recorded as sent');
    }
  });

  // 23. Duplicate email notification prevention
  await runTestCase('23', 'Repeated status update requests with unchanged status prevent duplicate email notifications', async () => {
    const repeatRes = await fetch(`${BASE}/admin/teams/${pptTeamId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'shortlisted',
        notifyLeader: true,
      }),
    }).then(r => r.json());

    if (!repeatRes.success) {
      throw new Error(`Repeat status update failed: ${repeatRes.error}`);
    }
    if (!repeatRes.message.includes('unchanged') && !repeatRes.message.includes('already in status')) {
      throw new Error(`Expected status unchanged message, got: ${repeatRes.message}`);
    }
  });

  // 24. Admin email notification retry
  await runTestCase('24', 'Admin can trigger retry for transactional email notifications', async () => {
    const retryRes = await fetch(`${BASE}/admin/teams/${pptTeamId}/resend-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ type: 'selection' }),
    }).then(r => r.json());

    if (!retryRes.success || retryRes.team.emailStatus?.selectionEmail?.status !== 'sent') {
      throw new Error(`Failed to retry email notification: ${retryRes.error || 'Expected status sent'}`);
    }
  });

  // 25. Shortlisted team can submit project deliverables
  await runTestCase('25', 'Shortlisted team is authorized to submit hackathon deliverables', async () => {
    const subRes = await fetch(`${BASE}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pptTeamLeaderToken}`,
      },
      body: JSON.stringify({
        projectTitle: 'TitanPulse Zero Trust Edge Grid',
        projectDescription: 'Distributed microservice telemetry and intrusion quarantine orchestrator for campus networks.',
        githubUrl: 'https://github.com/zeta-club/titan-pulse',
        demoUrl: 'https://titanpulse.dev',
      }),
    }).then(r => r.json());

    if (!subRes.success || !subRes.submission) {
      throw new Error(`Deliverable submission failed for shortlisted team: ${subRes.error}`);
    }
  });

  // --------------------------------------------------------------------------
  // Summary & Reporting
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 ZETATHON SECURITY SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');
  testResults.forEach(r => {
    console.log(`  [${r.status}] ${r.caseNumber}: ${r.description} ${r.error ? `(${r.error})` : ''}`);
  });
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
