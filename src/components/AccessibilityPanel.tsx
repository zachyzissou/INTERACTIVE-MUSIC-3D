// src/components/AccessibilityPanel.tsx
'use client'
import React, { useState } from 'react'
import { useAccessibility } from '../hooks/useAccessibility'

export function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { preferences, updatePreference } = useAccessibility()

  const togglePanel = () => setIsOpen(!isOpen)

  const handleToggle = (key: keyof typeof preferences) => {
    updatePreference(key, !preferences[key])
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={togglePanel}
        aria-label="Open accessibility settings"
        aria-expanded={isOpen ? "true" : "false"}
        className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path 
            d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9M15 12C15 12.7 14.6 13.2 14 13.5L13 15.5V22H11V15.5L10 13.5C9.4 13.2 9 12.7 9 12V9C9 8.4 9.4 8 10 8H14C14.6 8 15 8.4 15 9V12M3 13V11L9 11.5V13" 
            fill="currentColor"
          />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute bottom-16 right-0 w-80 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          role="dialog"
          aria-label="Accessibility Settings"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Accessibility Settings
            </h2>
            <button
              onClick={togglePanel}
              aria-label="Close accessibility settings"
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Reduce Motion */}
            <div className="flex items-center justify-between">
              <label 
                htmlFor="reduce-motion" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Reduce motion & animations
              </label>
              <button
                id="reduce-motion"
                onClick={() => handleToggle('reduceMotion')}
                role="switch"
                aria-checked={preferences.reduceMotion ? "true" : "false"}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  preferences.reduceMotion ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.reduceMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
                <span className="sr-only">
                  {preferences.reduceMotion ? 'Disable' : 'Enable'} motion reduction
                </span>
              </button>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <label 
                htmlFor="high-contrast" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                High contrast mode
              </label>
              <button
                id="high-contrast"
                onClick={() => handleToggle('highContrast')}
                role="switch"
                aria-checked={preferences.highContrast ? "true" : "false"}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  preferences.highContrast ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
                <span className="sr-only">
                  {preferences.highContrast ? 'Disable' : 'Enable'} high contrast
                </span>
              </button>
            </div>

            {/* Large Text */}
            <div className="flex items-center justify-between">
              <label 
                htmlFor="large-text" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Larger text size
              </label>
              <button
                id="large-text"
                onClick={() => handleToggle('largeText')}
                role="switch"
                aria-checked={preferences.largeText ? "true" : "false"}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  preferences.largeText ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.largeText ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
                <span className="sr-only">
                  {preferences.largeText ? 'Disable' : 'Enable'} large text
                </span>
              </button>
            </div>

            {/* Keyboard Navigation Info */}
            {preferences.keyboardNavigation && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  ✓ Keyboard navigation detected. Use Tab to navigate and Enter/Space to activate.
                </p>
              </div>
            )}

            {/* Screen Reader Info */}
            {preferences.screenReader && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-xs text-green-800 dark:text-green-200">
                  ✓ Screen reader detected. All visual elements have appropriate labels.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Settings are saved automatically and sync across browser sessions.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccessibilityPanel
