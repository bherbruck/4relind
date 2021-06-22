export const STACK = { min: 0, max: 7 }
export const RELAY = { min: 1, max: 4 }

export function validateStack(stack: number): boolean {
  return stack >= STACK.min && stack <= STACK.max
}

export function validateRelay(relay: number): boolean {
  return relay >= RELAY.min && relay <= RELAY.max
}

export function validateChannel(channel: number): boolean {
  return channel >= RELAY.min && channel <= RELAY.max
}
