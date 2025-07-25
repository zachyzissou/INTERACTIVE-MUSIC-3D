import { startAudioContext, playSpawnSound } from '../audio'
import { useAudioEngine } from '../../store/useAudioEngine'

export async function startAudio(): Promise<boolean> {
  try {
    await startAudioContext()
    useAudioEngine.getState().setAudioReady(true)
    await playSpawnSound()
    return true
  } catch (err) {
    console.error('Audio failed to start:', err)
    useAudioEngine.getState().setError(String(err))
    return false
  }
}
