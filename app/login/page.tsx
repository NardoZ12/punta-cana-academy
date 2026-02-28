const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  const { error: authError } = await signIn(email, password);
  if (authError) {
    setError(authError);
    setLoading(false);
  } else {
    router.refresh();
    router.push('/dashboard');
  }
}

// Removed useEffect for profile updates