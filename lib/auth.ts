import "server-only"

import { getIdentity } from "@vercel/passport"

export async function getPassportIdentity() {
  return getIdentity()
}

export async function requirePassportIdentity() {
  const identity = await getPassportIdentity()
  if (!identity) {
    throw new Error("Unauthorized")
  }
  return identity
}
