const AUTHENTICATED_MARKER = 'starsnap-authenticated';
const LEGACY_AUTH_STATE = 'auth-state';
const LEGACY_JWT_KEYS = ['access-token', 'refresh-token'];

class SessionState {
    public markAuthenticated(): void {
        localStorage.setItem(AUTHENTICATED_MARKER, 'true');
        localStorage.removeItem(LEGACY_AUTH_STATE);
        this.clearLegacyJwtValues();
    }

    public clear(): void {
        localStorage.removeItem(AUTHENTICATED_MARKER);
        localStorage.removeItem(LEGACY_AUTH_STATE);
        this.clearLegacyJwtValues();
    }

    public isAuthenticated(): boolean {
        const authenticated =
            localStorage.getItem(AUTHENTICATED_MARKER) === 'true' ||
            localStorage.getItem(LEGACY_AUTH_STATE) === 'true';

        if (authenticated) {
            localStorage.setItem(AUTHENTICATED_MARKER, 'true');
            localStorage.removeItem(LEGACY_AUTH_STATE);
            this.clearLegacyJwtValues();
        }

        return authenticated;
    }

    private clearLegacyJwtValues(): void {
        LEGACY_JWT_KEYS.forEach(key => localStorage.removeItem(key));
    }
}

export default new SessionState();
