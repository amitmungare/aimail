'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import { ModeToggle } from '@/components/theme-toggle'

const Mail = dynamic(()=>{
  return import('./mail')
},{
  ssr:false
})

const MailDashboard = () => {
  return (
    <>
     <div className="absolute bottom-4 left-4">
      {/* <ModeToggle/> */}
     </div>
    <Mail 
    defaultLayout={[20, 32, 48]}
    defaultCollapsed={false}
    navCollapsedSize={4}/>
    </>
  )
}

export default MailDashboard