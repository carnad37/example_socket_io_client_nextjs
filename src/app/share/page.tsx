'use client'

import { RESERVATIONS } from '@/constant'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <div>
        {Object.entries(RESERVATIONS).map(([key, value], index) => (
          <div key={index}>
            {index === 0 && <hr className={`my-2 h-0.5 bg-black`} />}
            <Link
              href={`/share/room/${key}`}
              className={`block cursor-pointer text-center text-black`}
            >
              {value.title}
            </Link>
            <hr className={`my-2 h-0.5 bg-black`} />
          </div>
        ))}
      </div>
    </>
  )
}
