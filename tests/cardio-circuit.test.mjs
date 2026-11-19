import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardioPhases, cardioPosition, newCardioTimer, restoreCardioTimer } from '../src/cardioCircuit.ts';

for (const ropeSeconds of [20, 30]) {
  test(`complete circuit sequence and exact boundaries with ${ropeSeconds}s rope`, () => {
    const phases = cardioPhases(ropeSeconds);
    assert.equal(phases.length, 23);
    const start = 100000;
    const timer = { ...newCardioTimer(ropeSeconds), status: 'active', resumedAt: start };
    let elapsed = 0;
    for (let round = 1; round <= 3; round++) {
      const expected = [40, 20, 40, 20, 30, 20, ropeSeconds, ...(round < 3 ? [60] : [])];
      for (const [index, seconds] of expected.entries()) {
        const current = cardioPosition(timer, start + elapsed);
        assert.equal(current.phase.round, round);
        assert.equal(current.phase.kind, index === 7 ? 'round-rest' : index % 2 === 0 ? 'exercise' : 'rest');
        assert.equal(current.remaining, seconds);
        assert.equal(cardioPosition(timer, start + elapsed + seconds * 1000 - 1).remaining, 1);
        elapsed += seconds * 1000;
      }
    }
    assert.equal(elapsed, ropeSeconds === 20 ? 690000 : 720000);
    const finished = cardioPosition(timer, start + elapsed);
    assert.equal(finished.complete, true);
    assert.equal(finished.remaining, 0);
    assert.equal(cardioPosition(timer, start + elapsed + 999999).elapsedMs, elapsed);
  });
}

test('paused time remains stable, and restored running time catches up', () => {
  const paused = { ...newCardioTimer(), status: 'active', elapsedMs: 12500 };
  assert.equal(cardioPosition(paused, 100000).remaining, 28);
  assert.equal(cardioPosition(paused, 900000).remaining, 28);
  const running = restoreCardioTimer(JSON.stringify({ ...paused, resumedAt: 100000 }));
  assert.equal(cardioPosition(running, 150000).phase.exercise, 1);
  assert.equal(cardioPosition(running, 150000).remaining, 38);
  for (const raw of ['oops', '{}', 'null', '{"ropeSeconds":99}']) assert.deepEqual(restoreCardioTimer(raw), newCardioTimer());
});
