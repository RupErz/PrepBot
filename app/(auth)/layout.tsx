import { isAuthenticated } from '@/lib/actions/auth.action'
import { redirect } from 'next/navigation'
import React from 'react'

const AuthLayout = async ({children}: 
    {children: React.ReactNode}
) => {
    // If user already logged in , redirect to home page.
    const isUserAuthenticated = await isAuthenticated()
    if (isUserAuthenticated) redirect("/") 

    return (
        <div className='auth-layout'>{children}</div>
    )
}

export default AuthLayout