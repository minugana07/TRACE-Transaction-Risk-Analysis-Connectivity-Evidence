import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryTraceApiAdapter } from '../api/in-memory-adapter.ts';
import { InvestigationStore } from '../state/investigation-store.ts';

describe('TRACE Case Management, Persistence & Transaction Immutability', () => {
  test('persists case status transitions and automatically appends procedural audit log', async () => {
    const api = new InMemoryTraceApiAdapter();
    const store = new InvestigationStore(api);

    await store.loadAlerts();
    await store.selectAlert('ALT-8801');

    assert.equal(store.getState().selectedAlert?.status, 'NEW');

    // Transition to UNDER_REVIEW
    await store.updateCaseStatus('UNDER_REVIEW', 'ANALYST_JONES');
    assert.equal(store.getState().selectedAlert?.status, 'UNDER_REVIEW');

    // Verify procedural note was recorded
    const notes = store.getState().selectedAlert?.notes || [];
    const latestNote = notes[notes.length - 1];
    assert.equal(latestNote.type, 'PROCEDURAL_UPDATE');
    assert.ok(latestNote.content.includes('UNDER_REVIEW'));
    assert.equal(latestNote.authorId, 'ANALYST_JONES');

    // Transition to ESCALATED
    await store.updateCaseStatus('ESCALATED', 'ANALYST_JONES');
    assert.equal(store.getState().selectedAlert?.status, 'ESCALATED');
  });

  test('adds and persists investigation notes with distinct note types', async () => {
    const api = new InMemoryTraceApiAdapter();
    const store = new InvestigationStore(api);

    await store.loadAlerts();
    await store.selectAlert('ALT-8801');

    const noteCountBefore = store.getState().selectedAlert?.notes.length || 0;

    await store.addNote({
      type: 'ANALYST_INTERPRETATION',
      content: 'Hypothesis: layering scheme facilitated through Singapore account.',
      authorId: 'USR-ANALYST-1',
      authorName: 'Senior Analyst Maya',
    });

    const notesAfter = store.getState().selectedAlert?.notes || [];
    assert.equal(notesAfter.length, noteCountBefore + 1);

    const addedNote = notesAfter[notesAfter.length - 1];
    assert.equal(addedNote.type, 'ANALYST_INTERPRETATION');
    assert.equal(addedNote.authorName, 'Senior Analyst Maya');
    assert.ok(addedNote.content.includes('layering scheme'));
  });

  test('CRITICAL IMMUTABILITY TEST: Case status change and note additions NEVER alter underlying transaction records', async () => {
    const api = new InMemoryTraceApiAdapter();
    const store = new InvestigationStore(api);

    await store.loadAlerts();
    await store.selectAlert('ALT-8801');

    // Take complete snapshot of transactions before any case mutations
    const transactionsBefore = JSON.stringify(api.getTransactionsSnapshot());

    // Perform multiple state modifications on the case
    await store.updateCaseStatus('UNDER_REVIEW', 'ANALYST_A');
    await store.addNote({
      type: 'ANALYST_INTERPRETATION',
      content: 'Testing transaction record immutability during analysis.',
      authorId: 'ANALYST_A',
      authorName: 'Analyst A',
    });
    await store.updateCaseStatus('ESCALATED', 'SUPERVISOR_B');
    await store.addNote({
      type: 'SUPERVISORY_REVIEW',
      content: 'Approved for external SAR filing consideration.',
      authorId: 'SUPERVISOR_B',
      authorName: 'Supervisor B',
    });

    // Take complete snapshot of transactions after case mutations
    const transactionsAfter = JSON.stringify(api.getTransactionsSnapshot());

    // Strict equality check: transactions must be 100% identical and untouched
    assert.equal(
      transactionsAfter,
      transactionsBefore,
      'Core transaction records must NEVER be altered or mutated by case investigation workflows'
    );
  });
});
