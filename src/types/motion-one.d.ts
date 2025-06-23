declare module '@motionone/react' {
  export const motion: any
  export function useMotionValue<T>(initial: T): any
  export function animate(value: any, to: any, options?: any): any
}
