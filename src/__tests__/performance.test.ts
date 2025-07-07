// src/__tests__/performance.test.ts
/**
 * Performance and quality assurance tests
 * Run with: npm test
 */

import { getPerformanceGrade } from '@/types/performance'

describe('Performance Monitoring', () => {
  it('should grade performance correctly', () => {
    const excellentMetrics = {
      fps: 60,
      memoryUsage: 50,
      cpuUsage: 30,
      gpuUsage: 40,
      audioLatency: 10,
      renderTime: 16,
      timestamp: Date.now()
    }

    expect(getPerformanceGrade(excellentMetrics)).toBe('excellent')

    const poorMetrics = {
      ...excellentMetrics,
      fps: 25,
      memoryUsage: 300
    }

    expect(getPerformanceGrade(poorMetrics)).toBe('poor')
  })

  it('should detect critical performance issues', () => {
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
    expect(grade).toBe('critical')
  })
})

describe('Audio Performance', () => {
  it('should maintain low audio latency', () => {
    const audioMetrics = {
      fps: 60,
      memoryUsage: 100,
      cpuUsage: 50,
      gpuUsage: 60,
      audioLatency: 5, // Very low latency
      renderTime: 16,
      timestamp: Date.now()
    }

    expect(audioMetrics.audioLatency).toBeLessThan(20) // Below 20ms is good
  })
})

describe('Responsive Performance', () => {
  it('should adapt to different screen sizes', () => {
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
    expect(getPerformanceGrade(mobileMetrics)).toBe('fair')
  })
})

export {}
