import { ObjectType } from '../config/objectTypes'
import { playNote, playChord, playBeat, startLoop } from './audio'

/**
 * Trigger a sound based on object type with proper error handling and user feedback.
 */
export async function triggerSound(type: ObjectType, id: string): Promise<void> {
  try {
    let success = false
    
    if (type === 'note') {
      success = await playNote(id)
    } else if (type === 'chord') {
      success = await playChord(id)
    } else if (type === 'beat') {
      success = await playBeat(id)
    } else {
      success = await startLoop(id)
    }
    
    // Provide visual feedback for successful sound trigger
    if (success) {
      // Dispatch custom event for UI feedback (e.g., visual pulse, color change)
      document.dispatchEvent(new CustomEvent('sound-triggered', { 
        detail: { type, id, success: true } 
      }))
    } else {
      console.warn(`Sound trigger failed for ${type} ${id} - audio may not be initialized`)
      // Attempt to reinitialize audio on user interaction
      const { initAudioEngine } = await import('./audio')
      await initAudioEngine()
    }
    
  } catch (error) {
    console.error(`Error triggering sound for ${type} ${id}:`, error)
    document.dispatchEvent(new CustomEvent('sound-triggered', { 
      detail: { type, id, success: false, error: error.message } 
    }))
  }
}
