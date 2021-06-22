import * as i2c from 'i2c-bus'
import { validateRelay, validateStack, validateChannel } from './validators'

const DEVICE_ADDRESS = 0x38
const RELAY4_INPORT_REG_ADD = 0x00
const RELAY4_OUTPORT_REG_ADD = 0x01
const RELAY4_POLINV_REG_ADD = 0x02
const RELAY4_CFG_REG_ADD = 0x03

const relayMaskRemap = [0x80, 0x40, 0x20, 0x10]
const relayChRemap = [7, 6, 5, 4]
const optoMaskRemap = [0x08, 0x04, 0x02, 0x01]
const optoChRemap = [3, 2, 1, 0]

function relayToIO(relay: number) {
  let value = 0
  for (let i = 0; i < 4; i++) {
    if ((relay & (1 << i)) !== 0) value += relayMaskRemap[i]
  }
  return value
}

function IOToRelay(iov: number) {
  let value = 0
  for (let i = 0; i < 4; i++) {
    if ((iov & relayMaskRemap[i]) !== 0) value += 1 << i
  }
  return value
}

function IOToOpto(iov: number) {
  let value = 0
  for (let i = 0; i < 4; i++) {
    if ((iov & optoMaskRemap[i]) === 0) value += 1 << i
  }
  return value
}

function optoToIO(opto: number) {
  let value = 0
  for (let i = 0; i < 4; i++) {
    if ((opto & (i << i)) === 0) value += optoMaskRemap[i]
  }
  return value
}

function check(bus: i2c.I2CBus, add: number) {
  const cfg = bus.readByteSync(add, RELAY4_CFG_REG_ADD)
  if (cfg != 0x0f) {
    bus.writeByteSync(add, RELAY4_CFG_REG_ADD, 0x0f)
    bus.writeByteSync(add, RELAY4_OUTPORT_REG_ADD, 0)
  }
  return bus.readByteSync(add, RELAY4_INPORT_REG_ADD)
}

export function setRelay(stack: number, relay: number, value: number) {
  if (!validateStack(stack)) throw new Error('Invalid stack level')
  if (!validateRelay(relay)) throw new Error('Invalid relay number')

  const bus = i2c.openSync(1)
  const st = (stack & 0x02) + (0x01 & (stack >> 2)) + (0x04 & (stack << 2))
  stack = 0x07 ^ st

  try {
    let oldValue = IOToRelay(check(bus, DEVICE_ADDRESS + stack))
    if (value === 0) {
      oldValue = relayToIO(oldValue & ~(1 << (relay - 1)))
      value = relayToIO(value)
      bus.writeByteSync(DEVICE_ADDRESS + stack, RELAY4_OUTPORT_REG_ADD, value)
    } else {
      oldValue = oldValue | (1 << (relay - 1))
      oldValue = relayToIO(oldValue)
      bus.writeByteSync(
        DEVICE_ADDRESS + stack,
        RELAY4_OUTPORT_REG_ADD,
        oldValue
      )
    }
  } catch (err) {
    console.error(err)
  } finally {
    bus.closeSync()
  }
}

export function getRelay(stack: number, relay: number) {
  if (!validateStack(stack)) throw new Error('Invalid stack level')
  if (!validateRelay(relay)) throw new Error('Invalid relay number')

  const bus = i2c.openSync(1)
  const st = (stack & 0x02) + (0x01 & (stack >> 2)) + (0x04 & (stack << 2))
  stack = 0x07 ^ st

  let value = 0

  try {
    value = check(bus, DEVICE_ADDRESS + stack)
  } catch (err) {
    console.error(err)
  } finally {
    bus.closeSync()
  }

  value = IOToRelay(value)
  value = value & (1 << (relay - 1))
  return value === 0 ? 0 : 1
}

export function getOpto(stack: number, channel: number) {
  if (!validateStack(stack)) throw new Error('Invalid stack level')
  if (!validateChannel(channel)) throw new Error('Invalid channel number')

  const bus = i2c.openSync(1)
  const st = (stack & 0x02) + (0x01 & (stack >> 2)) + (0x04 & (stack << 2))
  stack = 0x07 ^ st

  let value = 0

  try {
    value = check(bus, DEVICE_ADDRESS + stack)
  } catch (err) {
    console.error(err)
  } finally {
    bus.closeSync()
  }

  value = IOToOpto(value)
  value = value & (1 << (channel - 1))
  return value === 0 ? 0 : 1
}
