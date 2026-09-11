import React from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth.js'
import './navbar.scss'

const Navbar = () => {
    const { handleLogout, user } = useAuth()
    const navigate = useNavigate()

    const onLogout = async () => {
        await handleLogout()
        navigate('/login')
    }

    return (
        <nav className='app-navbar'>
            <Link to='/' className='app-navbar__brand'>
                <span className='app-navbar__logo'>✦</span>
                InterviewAI
            </Link>

            <div className='app-navbar__links'>
                <Link to='/' className='app-navbar__link'>New Plan</Link>
            </div>

            <div className='app-navbar__right'>
                {user && <span className='app-navbar__user'>{user.username}</span>}
                <button onClick={onLogout} className='button ghost-button'>
                    Logout
                </button>
            </div>
        </nav>
    )
}

export default Navbar