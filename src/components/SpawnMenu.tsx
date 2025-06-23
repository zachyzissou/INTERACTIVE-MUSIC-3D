'use client'
import React, { useEffect, useState } from 'react'
import { motion } from '@motionone/react'
import { useObjects } from '../store/useObjects'
import { objectTypes, objectConfigs } from '../config/objectTypes'
import styles from '../styles/spawnMenu.module.css'

const useIsMobile = () => {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return mobile
}

const SpawnMenu = () => {
  const spawn = useObjects((s) => s.spawn)
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(!isMobile)

  useEffect(() => {
    setOpen(!isMobile)
  }, [isMobile])

  return isMobile ? (
    <motion.div
      initial={{ height: '0px' }}
      animate={{ height: open ? '50vh' : '0px' }}
      transition={{ duration: 0.3 } as any}
      className={styles.drawer}
    >
      <button className={styles.toggle} onClick={() => setOpen((o) => !o)} />
      {objectTypes.map((t) => (
        <motion.button
          whileHover={{ scale: 1.1 }}
          key={t}
          className={styles.spawnButton}
          onClick={() => spawn(t)}
        >
          {objectConfigs[t].label}
        </motion.button>
      ))}
    </motion.div>
  ) : (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ duration: 0.5, easing: 'ease-in-out' } as any}
      className={styles.sidebar}
    >
      {objectTypes.map((t) => (
        <motion.button
          whileHover={{ scale: 1.1 }}
          key={t}
          className={styles.spawnButton}
          onClick={() => spawn(t)}
        >
          {objectConfigs[t].label}
        </motion.button>
      ))}
    </motion.div>
  )
}

export default SpawnMenu
