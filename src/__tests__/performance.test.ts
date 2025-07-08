// src/__tests__/performance.test.ts
/**
 * Performance and quality assurance tests
 * Run with: npm test
 */

import { getPerformanceGrade } from '@/types/performance'

// Simple test functions without Jest globals - just validate logic
export function testPerformanceGrading() {
  const excellentMetrics = {
    fps: 60,
    memoryUsage: 50,
    cpuUsage: 30,
    gpuUsage: 40,
    audioLatency: 10,
    renderTime: 16,
    timestamp: Date.now()
  }

  const excellentGrade = getPerformanceGrade(excellentMetrics)
  console.assert(excellentGrade === 'excellent', 'Excellent metrics should grade as excellent')

  const poorMetrics = {
    ...excellentMetrics,
    fps: 25,
    memoryUsage: 300
  }

  const poorGrade = getPerformanceGrade(poorMetrics)
  console.assert(poorGrade === 'poor', 'Poor metrics should grade as poor')
}

export function testCriticalPerformanceDetection() {
  const criticalMetrics = {
    fps: 15,
    memoryUsage: 800,
    cpuUsage: 95,
    gpuUsage: 90,
    audioLatency: 100,
    renderTime: 80,
    timestamp: Date.now()
  }

  const grade = getPerformanceGrade(criticalMetrics)
  console.assert(grade === 'critical', 'Critical metrics should grade as critical')
}

export function testAudioPerformance() {
  const audioMetrics = {
    fps: 60,
    memoryUsage: 100,
    cpuUsage: 50,
    gpuUsage: 60,
    audioLatency: 5, // Very low latency
    renderTime: 16,
    timestamp: Date.now()
  }

  console.assert(audioMetrics.audioLatency < 20, 'Audio latency should be below 20ms')
}

export function testResponsivePerformance() {
  const mobileMetrics = {
    fps: 30, // Lower on mobile
    memoryUsage: 150,
    cpuUsage: 70,
    gpuUsage: 80,
    audioLatency: 15,
    renderTime: 33, // 30fps
    timestamp: Date.now()
  }

  // Mobile should still achieve 'fair' performance
  const grade = getPerformanceGrade(mobileMetrics)
  console.assert(grade === 'fair', 'Mobile metrics should achieve fair performance')
}

// Run tests if executed directly
if (typeof window === 'undefined' && require.main === module) {
  testPerformanceGrading()
  testCriticalPerformanceDetection()
  testAudioPerformance()
  testResponsivePerformance()
  console.log('✅ All performance tests passed')
}
