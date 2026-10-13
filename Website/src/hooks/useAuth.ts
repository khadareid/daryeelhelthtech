
import {   setUser,
  updateTokens,
  updateUser,
  logout as logoutAction, } from '@/Redex/service/auth/Userinfo';
import { AppDispatch, RootState } from '@/Redex/store/store';
import { useDispatch, useSelector } from 'react-redux';
 

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.userInfo);

  return {
    // state
    user,
    isAuthenticated: user.isAuthenticated,
    hydrating: user.hydrating,             // ← ADDED

    // actions
    setUser: (payload: Parameters<typeof setUser>[0]) =>
      dispatch(setUser(payload)),
    updateTokens: (payload: Parameters<typeof updateTokens>[0]) =>
      dispatch(updateTokens(payload)),
    updateUser: (payload: Parameters<typeof updateUser>[0]) =>
      dispatch(updateUser(payload)),
    logout: () => dispatch(logoutAction()),
  };
}