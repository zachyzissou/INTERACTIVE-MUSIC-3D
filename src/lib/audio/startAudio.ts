import { enableAudioInit, initAudioEngine, playSpawnSound } from '../audio'
import { useAudioEngine } from '@/store/useAudioEngine'

export async function startAudio() {
  enableAudioInit()
  await initAudioEngine()
  useAudioEngine.getState().setAudioReady(true)
  await playSpawnSound()
}
