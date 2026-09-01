import { NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'

import { logUserOut } from '../slices/authSlice'

function Navbar() {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  return (
    <nav className='flex justify-between items-center p-6 shadow-md my-6 rounded-lg transparentCard'>
      <NavLink to='/posts'>
        <div className='flex items-center gap-x-2'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 text-white shadow-md'>
            <svg
              viewBox='0 0 24 24'
              aria-hidden='true'
              className='h-6 w-6'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M6 3h8l4 4v14H6z' />
              <path d='M14 3v5h5' />
              <path d='M9 12h6M9 16h4' />
              <path d='m14 19 4.5-4.5 1.5 1.5-4.5 4.5-2 .5z' />
            </svg>
          </div>
          <div className='flex flex-col'>
            <p className='text-xl font-semibold leading-6 text-orange-500 uppercase'>
              Blogify
            </p>
            <p className='text-xs font-medium leading-3 tracking-[0.12em] text-yellow-600'>
              with Mukul
            </p>
          </div>
        </div>
      </NavLink>
      {user ? (
        <div className='flex justify-center items-center space-x-2'>
          <div className='w-8 h-8 bg-blue-700 text-white rounded-full flex justify-center items-center font-bold'>
            {user.result.name.charAt(0).toUpperCase()}
          </div>
          <button
            className='bg-red-500 text-white cursor-pointer p-1 px-4 rounded-md uppercase'
            onClick={() => dispatch(logUserOut())}
          >
            Log Out
          </button>
        </div>
      ) : (
        <button
          className='bg-green-700 text-white p-1 px-4 rounded-md uppercase'
          onClick={() => navigate('/auth')}
        >
          Sign In
        </button>
      )}
    </nav>
  )
}

export default Navbar
