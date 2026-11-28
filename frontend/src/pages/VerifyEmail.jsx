
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API_URL from '../api';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState('Verifying your email...');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setMessage('Invalid verification link. Token is missing.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`
                );

                const responseText = await response.text();

                let data = {};

                try {
                    data = responseText ? JSON.parse(responseText) : {};
                } catch {
                    throw new Error('The server returned an invalid response.');
                }

                if (!response.ok) {
                    throw new Error(
                        data.message || `Verification failed (${response.status}).`
                    );
                }

                setSuccess(true);
                setMessage(
                    data.message || 'Your email has been verified successfully!'
                );

            } catch (error) {
                console.error('Email verification error:', error);
                setMessage(error.message || 'Unable to verify your email.');
            }
        };

        verifyEmail();
    }, [searchParams]);

    return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>
                {success ? 'Email Verified!' : 'Email Verification'}
            </h2>

            <p>{message}</p>

            {success && (
                <Link to="/login">
                    Go to Login
                </Link>
            )}
        </div>
    );
}
