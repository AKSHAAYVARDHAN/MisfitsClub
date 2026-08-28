import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Read Firebase config
  let firebaseConfig: any = {};
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading firebase-applet-config.json:', err);
  }

  const AUTHORIZED_OWNER_EMAIL = (process.env.INITIAL_OWNER_EMAIL || 'akshaayvardhans@gmail.com').toLowerCase().trim();

  // =========================================================================
  // API ROUTES
  // =========================================================================

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Check if initial owner is already bootstrapped
  app.get('/api/admin/bootstrap-status', async (req, res) => {
    try {
      res.json({
        authorizedOwnerEmail: AUTHORIZED_OWNER_EMAIL,
        isConfigured: Boolean(AUTHORIZED_OWNER_EMAIL),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Trusted Server-Side Initial Owner Bootstrap
  app.post('/api/admin/bootstrap', async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.body.idToken;

      if (!token) {
        return res.status(401).json({
          error: 'UNAUTHENTICATED',
          message: 'Missing Firebase Auth ID token in Authorization header or body.',
        });
      }

      // Verify token with Firebase Auth Identity Toolkit REST API
      const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`;
      const verifyRes = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        return res.status(401).json({
          error: 'INVALID_TOKEN',
          message: 'Firebase ID token verification failed.',
          details: errorData,
        });
      }

      const userData = await verifyRes.json();
      const user = userData.users?.[0];

      if (!user || !user.localId) {
        return res.status(401).json({
          error: 'USER_NOT_FOUND',
          message: 'No Firebase user record found for this token.',
        });
      }

      const uid = user.localId;
      const email = (user.email || '').toLowerCase().trim();
      const displayName = user.displayName || 'Club Owner';

      // Security Constraint: Verify caller against authorized owner email
      if (email !== AUTHORIZED_OWNER_EMAIL) {
        console.warn(`[RBAC Bootstrap] Unauthorized attempt from email: ${email}, expected: ${AUTHORIZED_OWNER_EMAIL}`);
        return res.status(403).json({
          error: 'UNAUTHORIZED_IDENTITY',
          message: `Account '${email}' is not authorized to initialize Owner privileges. Only '${AUTHORIZED_OWNER_EMAIL}' is designated.`,
        });
      }

      const now = new Date().toISOString();
      const staffDoc = {
        uid,
        email,
        name: displayName,
        role: 'OWNER',
        status: 'active',
        assignedBy: 'SYSTEM_BOOTSTRAP',
        assignedAt: now,
        updatedAt: now,
      };

      // Write directly to Firestore REST API for this document
      const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents/adminRoles/${uid}?key=${firebaseConfig.apiKey}`;

      const firestorePayload = {
        fields: {
          uid: { stringValue: uid },
          email: { stringValue: email },
          name: { stringValue: displayName },
          role: { stringValue: 'OWNER' },
          status: { stringValue: 'active' },
          assignedBy: { stringValue: 'SYSTEM_BOOTSTRAP' },
          assignedAt: { stringValue: now },
          updatedAt: { stringValue: now },
        },
      };

      const firestoreRes = await fetch(firestoreUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(firestorePayload),
      });

      if (!firestoreRes.ok) {
        const firestoreError = await firestoreRes.json();
        console.error('[RBAC Bootstrap] Firestore write error:', firestoreError);
        return res.status(500).json({
          error: 'FIRESTORE_WRITE_FAILED',
          message: 'Failed to write initial Owner role into Firestore.',
          details: firestoreError,
        });
      }

      console.log(`[RBAC Bootstrap] SUCCESS: Initial Owner provisioned for ${email} (UID: ${uid})`);

      return res.json({
        success: true,
        message: `Owner privileges successfully initialized for ${email}.`,
        staff: staffDoc,
      });
    } catch (err: any) {
      console.error('[RBAC Bootstrap] Internal exception:', err);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: err.message || 'An unexpected error occurred during bootstrap.',
      });
    }
  });

  // =========================================================================
  // VITE & STATIC SERVING
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
