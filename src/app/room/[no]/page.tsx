import React from 'react'
import ItemDetail from '@/components/item-detail'

interface Props {
  children?: React.ReactNode
}

const ReservationPage = ({ children }: Props) => {
  return (
    <>
      <ItemDetail></ItemDetail>
    </>
  )
}

export default ReservationPage
