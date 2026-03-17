import type { RouterClient } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { router } from "@Stendhal/backend/src/orpc/Router"
import { Store } from 'stores/Store'

const store = Store()

// create the ORPC client with the RPCLink transport
const link = new RPCLink({
  url: `https://${store.getDomain()}/api/rpc`,
  headers: { Authorization: 'Bearer token' },
})

export const orpc: RouterClient<typeof router> = createORPCClient(link)