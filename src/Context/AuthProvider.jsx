// AuthProvider.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rol, setRol] = useState(localStorage.getItem('user_rol') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setRol(localStorage.getItem('user_rol') || '');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setRol(localStorage.getItem('user_rol') || '');
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, rol, setUser, setRol, loading }}>
      {children}
    </AuthContext.Provider>
  );
}