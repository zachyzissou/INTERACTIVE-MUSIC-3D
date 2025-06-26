import { startAudioEngine, startNote } from '../audio'
import { useAudioReady } from '@/store/useAudioReady'

export async function startAudio() {
  await startAudioEngine()
  useAudioReady.getState().setAudioReady(true)
  await startNote('C5')
}
