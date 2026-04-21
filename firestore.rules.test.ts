import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'test-project',
    firestore: {
      rules: readFileSync(resolve(__dirname, 'DRAFT_firestore.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Firestore Security Rules', () => {
  it('should block identity spoofing', async () => {
    const db = testEnv.authenticatedContext('hacker', { email_verified: true }).firestore();
    await assertFails(db.collection('users').doc('hacker').set({ id: 'hacker', name: 'Hacker', role: 'Admin' }));
  });
  
  it('should allow authentic user creation', async () => {
    const db = testEnv.authenticatedContext('user123', { email_verified: true }).firestore();
    await assertSucceeds(db.collection('users').doc('user123').set({ id: 'user123', name: 'Legit', role: 'Tenant' }));
  });

  // More tests would be written to run complete TDD.
});
