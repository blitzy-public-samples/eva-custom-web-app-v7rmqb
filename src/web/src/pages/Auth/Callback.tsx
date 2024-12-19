import { FC, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const Callback: FC = () => {
  const { handleRedirectCallback } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await handleRedirectCallback();
        // After successful callback handling, redirect to dashboard
        // navigate('/dashboard');
      } catch (error) {
        console.error('Error handling callback:', error);
        // navigate('/login');
      }
    };

    handleCallback();
  }, [handleRedirectCallback, navigate]);

  return (
    <div className="callback-container">
      <div className="loading-spinner">Processing login...</div>
    </div>
  );
};

export default Callback;
