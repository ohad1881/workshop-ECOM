import { useEffect, useReducer } from 'react';
import { getToken, getRefreshToken, setTokens, clearTokens } from '../../api/client';
import { logout as logoutRequest, getCurrentUser } from '../../api/auth';
import { AuthContext } from './AuthContext';

const initialState = {
  user: null,
  loading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount, restore the session from a stored token by fetching the current
  // user. A bad/expired token clears the session so we don't strand the app in
  // an authenticated-but-userless state.
  useEffect(() => {
    if (!getToken()) {
      dispatch({ type: 'LOGOUT' });
      return;
    }
    getCurrentUser()
      .then((user) => dispatch({ type: 'LOGIN', payload: { user } }))
      .catch(() => {
        clearTokens();
        dispatch({ type: 'LOGOUT' });
      });
  }, []);

  const login = (userData, accessToken, refreshToken) => {
    setTokens(accessToken, refreshToken);
    dispatch({
      type: 'LOGIN',
      payload: { user: userData },
    });
  };

  const register = (userData, accessToken, refreshToken) => {
    setTokens(accessToken, refreshToken);
    dispatch({
      type: 'LOGIN',
      payload: { user: userData },
    });
  };

  const logout = () => {
    // Best-effort blacklist of the refresh token; clear locally regardless of outcome.
    const refresh = getRefreshToken();
    if (refresh) {
      logoutRequest(refresh).catch(() => {});
    }
    clearTokens();
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    user: state.user,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    login,
    register,
    logout,
    setUser: (user) => dispatch({
      type: 'LOGIN',
      payload: { user },
    }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
