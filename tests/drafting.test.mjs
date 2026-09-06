import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalOutputs, csvCell} from '../lib/drafting.ts';
test('every local format reflects the supplied topic', () => {
 const result=createLocalOutputs('Mangrove roots protect coastlines. Coastal communities plant seedlings during suitable tides. Volunteers monitor the young trees each month.', 'Mangrove restoration', 'Educational', 'Students');
 for(const value of Object.values(result)) {assert.match(value,/Mangrove|mangrove/);assert.doesNotMatch(value,/content strategy|better distribution/i);}
 assert.equal(Object.keys(result).length,5);
});
test('short source fragments remain present and X posts stay within 280 characters', () => {
 const result=createLocalOutputs('Solar panels collect sunlight\nBatteries store energy\n'+('Long sentence about electricity. '.repeat(20)), 'Solar power','Professional','General audience');
 assert.match(result.summary,/Batteries store energy/);
 for(const post of result.xThread.split('\n\n'))assert.ok(post.length<=280);
});
test('CSV protects spreadsheet formulas and quotes', () => {assert.equal(csvCell('=1+1'),'"\'=1+1"');assert.equal(csvCell('Say "hi"'),'"Say ""hi"""');});
