import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOpportunityScore,
  isValidStatusTransition,
  interpolateEmailTemplate,
  calculateDashboardStats,
  generateDefaultDraftForProspect,
} from './pipeline.ts';
import type { Prospect } from '../types/index.ts';

test('calculateOpportunityScore scores missing website highest', () => {
  const scoreNoWeb = calculateOpportunityScore({
    rating: 4.8,
    reviewsCount: 45,
    websiteStatus: 'no_website',
  });
  const scoreModern = calculateOpportunityScore({
    rating: 4.8,
    reviewsCount: 45,
    websiteStatus: 'modern',
  });

  assert.ok(scoreNoWeb >= 80, `Expected scoreNoWeb >= 80, got ${scoreNoWeb}`);
  assert.ok(scoreNoWeb > scoreModern, `Expected scoreNoWeb > scoreModern`);
});

test('calculateOpportunityScore caps at 100 and scales with reviews', () => {
  const maxScore = calculateOpportunityScore({
    rating: 5.0,
    reviewsCount: 200,
    websiteStatus: 'no_website',
  });
  assert.equal(maxScore, 95);

  const lowScore = calculateOpportunityScore({
    rating: 3.0,
    reviewsCount: 2,
    websiteStatus: 'modern',
  });
  assert.equal(lowScore, 25);
});

test('isValidStatusTransition validates pipeline transitions accurately', () => {
  // Same status should always be valid
  assert.equal(isValidStatusTransition('discovered', 'discovered'), true);

  // Discovered can move to demo_created or pitched or passed
  assert.equal(isValidStatusTransition('discovered', 'demo_created'), true);
  assert.equal(isValidStatusTransition('discovered', 'pitched'), true);
  assert.equal(isValidStatusTransition('discovered', 'passed'), true);
  assert.equal(isValidStatusTransition('discovered', 'closed_won'), false);

  // Closed won cannot transition to anything
  assert.equal(isValidStatusTransition('closed_won', 'discovered'), false);

  // Passed can be resurrected to discovered or pitched
  assert.equal(isValidStatusTransition('passed', 'discovered'), true);
});

test('interpolateEmailTemplate properly substitutes single and double bracket variables', () => {
  const template = 'Hi {{contactName}}, I noticed {{businessName}} in {city} does not have a mobile-friendly site: {demoUrl}.';
  const variables = {
    contactName: 'Dr. Michael',
    businessName: 'Apex Dental Care',
    city: 'Austin',
    demoUrl: 'https://siteseller.preview/apex-dental',
  };

  const output = interpolateEmailTemplate(template, variables);
  assert.equal(
    output,
    'Hi Dr. Michael, I noticed Apex Dental Care in Austin does not have a mobile-friendly site: https://siteseller.preview/apex-dental.'
  );
});

test('calculateDashboardStats handles empty list and aggregates metrics correctly', () => {
  const emptyStats = calculateDashboardStats([], 0);
  assert.equal(emptyStats.totalProspects, 0);
  assert.equal(emptyStats.pipelineValue, 0);
  assert.equal(emptyStats.avgOpportunityScore, 0);

  const mockProspects: Prospect[] = [
    {
      id: 'p-1',
      name: 'Apex Dental',
      category: 'Dentist',
      address: '100 Main St',
      city: 'Austin',
      state: 'TX',
      phone: '555-1234',
      email: 'apex@example.com',
      rating: 4.8,
      reviewsCount: 60,
      websiteUrl: null,
      websiteStatus: 'no_website',
      opportunityScore: 90,
      painPoints: ['No website'],
      pipelineStatus: 'pitched',
      estimatedDealValue: 2500,
      placeId: 'pl-1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-2',
      name: 'Old Town Plumbing',
      category: 'Plumber',
      address: '200 Oak Ave',
      city: 'Austin',
      state: 'TX',
      phone: '555-5678',
      email: 'plumb@example.com',
      rating: 4.5,
      reviewsCount: 30,
      websiteUrl: 'http://plumbold.com',
      websiteStatus: 'broken_mobile',
      opportunityScore: 75,
      painPoints: ['Not mobile friendly'],
      pipelineStatus: 'meeting_booked',
      estimatedDealValue: 1800,
      placeId: 'pl-2',
      createdAt: new Date().toISOString(),
    },
  ];

  const stats = calculateDashboardStats(mockProspects, 5);
  assert.equal(stats.totalProspects, 2);
  assert.equal(stats.activePitchesSent, 5);
  assert.equal(stats.meetingsBooked, 1);
  assert.equal(stats.pipelineValue, 4300);
  assert.equal(stats.avgOpportunityScore, 83);

  const unpricedProspectStats = calculateDashboardStats([
    { ...mockProspects[0], estimatedDealValue: 0 },
  ], 0);
  assert.equal(unpricedProspectStats.pipelineValue, 0);
});

test('generateDefaultDraftForProspect returns tailored content for dental category', () => {
  const draft = generateDefaultDraftForProspect({
    id: 'p-101',
    name: 'Smile Studio',
    category: 'Dental Clinic',
    city: 'Seattle',
  });

  assert.equal(draft.industry, 'Modern Dental & Wellness');
  assert.ok(draft.headline.length > 0);
  assert.ok(draft.services.length >= 3);
  assert.equal(draft.metrics, undefined);
});
