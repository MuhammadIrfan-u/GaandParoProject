import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, MapPin, Loader2, X, XCircle } from 'lucide-react';

interface JoinNeighborhoodModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    neighborhoodId: number;
    neighborhoodName: string;
    onJoinSuccess?: () => void;
}

type ModalState =
    | 'idle'
    | 'requesting-location'
    | 'verifying'
    | 'success'           // location matched → joined as verified
    | 'rejected'          // location did not match → NOT joined
    | 'denied'            // browser permission denied
    | 'error';            // network / server error

interface LocationData {
    city: string;
    state: string;
    displayName: string;
}

interface NeighborhoodLocationData {
    city: string;
    state: string;
}

export const JoinNeighborhoodModal: React.FC<JoinNeighborhoodModalProps> = ({
    isOpen,
    onOpenChange,
    neighborhoodId,
    neighborhoodName,
    onJoinSuccess,
}) => {
    const [state, setState] = useState<ModalState>('idle');
    const [userLocation, setUserLocation] = useState<LocationData | null>(null);
    const [neighborhoodLocation, setNeighborhoodLocation] = useState<NeighborhoodLocationData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

    const handleGetLocation = () => {
        setState('requesting-location');
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setState('error');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCoordinates({ latitude, longitude });
                setState('verifying');
                await verifyLocation(latitude, longitude);
            },
            (geoError) => {
                setState('denied');
                const messages: Record<number, string> = {
                    1: 'Please enable location access in your browser settings',
                    2: 'Unable to determine your location',
                    3: 'Location request timed out',
                };
                setError(messages[geoError.code] || 'Failed to get your location');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const verifyLocation = async (latitude: number, longitude: number) => {
        try {
            const currentUserId = localStorage.getItem('user_id') || '11111111-1111-1111-1111-111111111111';

            const response = await fetch(
                `http://localhost:3000/api/neighborhoods/${neighborhoodId}/join`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ latitude, longitude, userId: currentUserId }),
                }
            );

            const data = await response.json();

            // 403 = location mismatch (not joined)
            if (response.status === 403 && data.code === 'LOCATION_MISMATCH') {
                setUserLocation(data.userLocation);
                setNeighborhoodLocation(data.neighborhoodLocation || data.neighborhood || null);
                setState('rejected');
                return;
            }

            // 400 = already a member elsewhere
            if (response.status === 400 && data.code === 'ALREADY_MEMBER_ELSEWHERE') {
                setError(data.error || 'You are already a member of another neighborhood. Please leave it first.');
                setState('error');
                return;
            }

            // Other errors
            if (!response.ok) {
                setError(data.error || 'Failed to verify location');
                setState('error');
                return;
            }

            // 200/201 = location matched, joined as verified
            setUserLocation(data.userLocation);
            setNeighborhoodLocation(data.neighborhoodLocation || data.neighborhood || null);
            setState('success');

            if (onJoinSuccess) onJoinSuccess();

            // Auto-close after 2 seconds
            setTimeout(() => onOpenChange(false), 2000);

        } catch (err) {
            console.error('Error verifying location:', err);
            setError('Network error while verifying location');
            setState('error');
        }
    };

    const handleRetry = () => {
        setUserLocation(null);
        setNeighborhoodLocation(null);
        setError(null);
        setCoordinates(null);
        setState('idle');
    };

    const handleClose = () => {
        handleRetry();
        onOpenChange(false);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 z-50 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <Dialog.Title className="text-xl font-bold text-gray-900">
                            Join {neighborhoodName}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
                                <X size={20} />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="min-h-56">

                        {/* ── Idle ─────────────────────────────────────────────────────── */}
                        {state === 'idle' && (
                            <div className="space-y-4">
                                <p className="text-gray-600">
                                    To join this neighbourhood, we need to verify you're physically located in <strong>{neighborhoodName}</strong>.
                                </p>
                                <p className="text-sm text-gray-500">
                                    Your coordinates are checked against the neighbourhood's city. If they don't match, you won't be able to join.
                                </p>
                                <Button onClick={handleGetLocation} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                    <MapPin size={16} className="mr-2" />
                                    Verify My Location
                                </Button>
                            </div>
                        )}

                        {/* ── Requesting location ───────────────────────────────────────── */}
                        {state === 'requesting-location' && (
                            <div className="flex flex-col items-center justify-center space-y-4 py-8">
                                <Loader2 size={40} className="text-blue-600 animate-spin" />
                                <p className="text-gray-600 font-medium">Requesting your location…</p>
                                <p className="text-sm text-gray-500 text-center">
                                    Please allow location access when prompted by your browser
                                </p>
                            </div>
                        )}

                        {/* ── Verifying ─────────────────────────────────────────────────── */}
                        {state === 'verifying' && (
                            <div className="flex flex-col items-center justify-center space-y-4 py-8">
                                <Loader2 size={40} className="text-blue-600 animate-spin" />
                                <p className="text-gray-600 font-medium">Verifying location…</p>
                                <p className="text-sm text-gray-500">
                                    {coordinates?.latitude.toFixed(4)}, {coordinates?.longitude.toFixed(4)}
                                </p>
                            </div>
                        )}

                        {/* ── Success (verified) ────────────────────────────────────────── */}
                        {state === 'success' && (
                            <div className="flex flex-col items-center justify-center space-y-4 py-6">
                                <div className="bg-green-100 rounded-full p-3">
                                    <CheckCircle size={40} className="text-green-600" />
                                </div>
                                <p className="text-gray-900 font-bold text-lg">Location Verified!</p>
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 w-full text-center">
                                    <p className="text-sm font-semibold text-green-900 mb-1">✓ Joined as Verified Member</p>
                                    <p className="text-xs text-green-800">
                                        Your location matches {neighborhoodName}. Welcome aboard!
                                    </p>
                                </div>
                                {userLocation && (
                                    <p className="text-sm text-gray-500">
                                        {userLocation.city || userLocation.state}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ── Rejected (location mismatch) ──────────────────────────────── */}
                        {state === 'rejected' && (
                            <div className="space-y-4">
                                <div className="bg-red-50 border border-red-300 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-red-900">Location Mismatch — Not Joined</p>
                                            <p className="text-sm text-red-800 mt-1">
                                                Your current location doesn't match this neighbourhood. You have not been added.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Your Location</p>
                                        <p className="text-gray-900">
                                            {userLocation?.city
                                                ? `${userLocation.city}${userLocation.state ? `, ${userLocation.state}` : ''}`
                                                : userLocation?.displayName || 'Unknown'}
                                        </p>
                                    </div>
                                    <div className="border-t border-gray-200" />
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Required Location</p>
                                        <p className="text-gray-900">
                                            {neighborhoodLocation?.city
                                                ? `${neighborhoodLocation.city}${neighborhoodLocation.state ? `, ${neighborhoodLocation.state}` : ''}`
                                                : neighborhoodName}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 text-center">
                                    You must be physically present in {neighborhoodLocation?.city || neighborhoodName} to join this neighbourhood.
                                </p>

                                <div className="flex gap-2">
                                    <Button onClick={handleRetry} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                                        <MapPin size={14} className="mr-1.5" />
                                        Try Again
                                    </Button>
                                    <Button onClick={handleClose} variant="outline" className="flex-1">
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* ── Permission denied ─────────────────────────────────────────── */}
                        {state === 'denied' && (
                            <div className="space-y-4">
                                <div className="bg-red-50 border border-red-300 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-red-900">Location Access Denied</p>
                                            <p className="text-sm text-red-800 mt-1">{error}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">To fix this:</p>
                                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                                        <li>Look for the location icon in your browser's address bar</li>
                                        <li>Click it and select "Allow"</li>
                                        <li>Then try again</li>
                                    </ol>
                                </div>
                                <Button onClick={handleRetry} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                    <MapPin size={16} className="mr-2" />
                                    Try Again
                                </Button>
                            </div>
                        )}

                        {/* ── Error ─────────────────────────────────────────────────────── */}
                        {state === 'error' && (
                            <div className="space-y-4">
                                <div className="bg-red-50 border border-red-300 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-red-900">Something went wrong</p>
                                            <p className="text-sm text-red-800 mt-1">{error}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleRetry} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                                        Try Again
                                    </Button>
                                    <Button onClick={handleClose} variant="outline" className="flex-1">
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="mt-5 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 text-center">
                            🔒 Location is only used for verification and is not stored permanently.
                        </p>
                    </div>

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default JoinNeighborhoodModal;