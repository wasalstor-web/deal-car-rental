/* eslint-disable react-refresh/only-export-components */
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as bookcarsTypes from ':bookcars-types'
import * as UserService from '@/services/UserService'

// Create context
export interface UserContextType {
  user: bookcarsTypes.User | null
  setUser: React.Dispatch<React.SetStateAction<bookcarsTypes.User | null>>
  userLoaded: boolean
  setUserLoaded: React.Dispatch<React.SetStateAction<boolean>>
  unauthorized: boolean
}

const UserContext = createContext<UserContextType | null>(null)

// Create a provider
interface UserProviderProps {
  children: ReactNode
  refreshKey?: number
}

export const UserProvider: React.FC<UserProviderProps> = ({ children, refreshKey }) => {
  const [user, setUser] = useState<bookcarsTypes.User | null>(null)
  const [userLoaded, setUserLoaded] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)

  const value = useMemo(() => ({ user, setUser, userLoaded, setUserLoaded, unauthorized }), [user, userLoaded, unauthorized])

  const exit = useCallback(async () => {
    setUser(null)
    setUserLoaded(true)
    await UserService.signout(false, false)
  }, [])

  const checkUser = useCallback(async () => {
    setUserLoaded(false)

    const currentUser = UserService.getCurrentUser()
    if (!currentUser) {
      await exit()
      return
    }

    try {
      const status = await UserService.validateAccessToken()

      if (status === 200) {
        const _user = await UserService.getUser(currentUser._id)
        if (_user) {
          if (_user.blacklisted) {
            setUser(_user)
            setUnauthorized(true)
          } else {
            setUser(_user)
            setUnauthorized(false)
          }
        } else {
          await exit()
        }
      } else {
        await exit()
      }
    } catch {
      await exit()
    } finally {
      setUserLoaded(true)
    }
  }, [exit])

  /** `null` = أول تشغيل؛ يضمن checkUser عند أول mount حتى لو refreshKey === 0 */
  const prevRefreshKey = useRef<number | null>(null)

  useEffect(() => {
    const key = refreshKey ?? 0
    if (prevRefreshKey.current === null || prevRefreshKey.current !== key) {
      checkUser()
      prevRefreshKey.current = key
    }
  }, [refreshKey, checkUser])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

// Create a custom hook to access context
export const useUserContext = () => useContext(UserContext)
