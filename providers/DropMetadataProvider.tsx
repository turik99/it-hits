import { useProvider } from 'wagmi'
import React, { ReactNode, useContext, useEffect, useMemo, useState } from 'react'
// import {DropMetadataRenderer__factory} from '@zoralabs/nft-drop-contracts/dist/typechain/DropMetadataRenderer'
import { DropMetadataRenderer__factory } from '../constants/typechain'
import { DROPS_METADATA_RENDERER } from '../lib/constants'
import { ipfsImage } from '@lib/helpers'

interface MetadataProps {
  description?: string
  imageURI?: string
  allowlistURI?: string
  loading: boolean
}

export interface DropMetadataProviderState {
  metadata: any
}

export const DropMetadataContext = React.createContext<DropMetadataProviderState>(
  {} as DropMetadataProviderState
)

function DropMetadataContractProvider({
  address,
  metadataRendererAddress,
  children,
}: {
  address: string
  metadataRendererAddress: string
  children?: ReactNode
}) {
  const provider = useProvider()
  const [metadata, setMetadata] = useState<MetadataProps | boolean>({ loading: true })
  const metadataRenderer = useMemo(
    () =>
      provider && metadataRendererAddress && metadataRendererAddress === DROPS_METADATA_RENDERER
        ? DropMetadataRenderer__factory.connect(metadataRendererAddress, provider)
        : null,
    [provider, metadataRendererAddress]
  )

  useEffect(() => {
    ;(async () => {
      if (!address || !metadataRenderer) {
        return
      }
      const metadataBases = await metadataRenderer.metadataBaseByContract(address)
      try {
        // Fetch contractURI and parse it
        const req = await fetch(ipfsImage(metadataBases.contractURI))
        const data = await req.json()
        setMetadata({
          loading: false,
          imageURI: data.image || data.imageURI,
          description: data.description,
          allowlistURI: data.allowlistURI || data.allowlist_uri,
        })
      } catch (e: any) {
        setMetadata(false)
      }
    })()
  }, [address, metadataRenderer])

  return (
    <DropMetadataContext.Provider value={{ metadata }}>
      {children}
    </DropMetadataContext.Provider>
  )
}

export default DropMetadataContractProvider

export const useDropMetadataContract = () => useContext(DropMetadataContext)
