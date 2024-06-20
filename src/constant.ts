'use client'

interface RoomDataType {
  title: string
  imageUrl: string
}

export const SOCKET_URL = '####'
export const RESERVATIONS: Record<string, RoomDataType> = {
  '1': {
    title: 'hotel1',
    imageUrl: '/images/hotel1.jpg'
  },
  '2': {
    title: 'hotel2',
    imageUrl: '/images/hotel2.jpg'
  },
  '3': {
    title: 'hotel3',
    imageUrl: '/images/hotel3.jpg'
  },
  '4': {
    title: 'hotel4',
    imageUrl: '/images/hotel4.jpg'
  }
} as const
