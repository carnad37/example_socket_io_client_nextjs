'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const NotFound = () => {
  const router = useRouter()
  useEffect(() => {
    router.replace('/')
  }, [])
  return <></>
}

export default NotFound
