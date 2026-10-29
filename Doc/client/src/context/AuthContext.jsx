import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
const [user, setUser] = useState(() => {
try {
const savedUser = localStorage.getItem('user');
return savedUser ? JSON.parse(savedUser) : null;
} catch {
return null;
}
});

const [token, setToken] = useState(
() => localStorage.getItem('token') || ''
);

  const login = (userData, authToken) => {
    let userToStore = userData;
    let tokenToStore = authToken;

    if (!authToken && userData && typeof userData === 'object' && userData.token && userData.user) {
      userToStore = userData.user;
      tokenToStore = userData.token;
    }

    if (userToStore) {
      localStorage.setItem('user', JSON.stringify(userToStore));
      setUser(userToStore);
    }
    if (tokenToStore) {
      localStorage.setItem('token', tokenToStore);
      setToken(tokenToStore);
    }
  };

const logout = () => {
localStorage.removeItem('user');
localStorage.removeItem('token');


setUser(null);
setToken('');


};

const value = {
user,
token,
login,
logout,
isAuthenticated: Boolean(user && token),
};

return (
<AuthContext.Provider value={value}>
{children}
</AuthContext.Provider>
);
}

export function useAuth() {
const context = useContext(AuthContext);

if (!context) {
throw new Error('useAuth must be used inside AuthProvider');
}

return context;
}
