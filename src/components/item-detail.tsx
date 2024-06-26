'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { RESERVATIONS, SOCKET_URL } from '@/constant'
import useSocket from '@/hooks/use-socket'
import { getCookie } from 'cookies-next'

interface Props {
  children?: React.ReactNode
}

const ItemDetail = ({ children }: Props) => {
  const [viewer, setViewer] = useState<undefined | string>()
  const params = useParams()
  const roomNo = useMemo(() => {
    let result = params.no
    if (Array.isArray(result)) {
      result = result[0]
    }
    return result ?? '1'
  }, [params])
  const userKey = getCookie('userKey')?.toString() || ''
  const roomData = RESERVATIONS[roomNo]

  const { connect } = useSocket(SOCKET_URL, {
    path: '/room',
    header: { room: roomNo, userKey },
    transport: 'websocket',
    query: {
      room: roomNo
    },
    onConnect: (socket) => {
      if (userKey) {
        socket.emit('addViewer', { room: roomNo, userKey })
      }
    },
    onEvents: [
      {
        name: 'getCount',
        event: (count) => {
          setViewer(count)
        }
      }
    ]
  })

  useEffect(() => {
    connect()
  }, [])

  return (
    <>
      <hr
        className={`mx-auto my-4 h-1 w-4/5 rounded border-0 bg-gray-100 md:my-10 dark:bg-gray-700`}
      />
      <div className={`mb-3 text-center text-4xl font-bold text-black`}>
        {roomData.title.toUpperCase()}
      </div>
      <div>
        <Image
          className={`mx-auto`}
          src={roomData.imageUrl}
          alt={roomData.title}
          width={400}
          height={300}
        ></Image>
      </div>
      <hr
        className={`mx-auto my-4 h-1 w-4/5 rounded border-0 bg-gray-100 md:my-10 dark:bg-gray-700`}
      />
      {viewer && <div className={`text-black`}>현재 접속 인원 : {viewer}</div>}
    </>
  )
}

export default ItemDetail
