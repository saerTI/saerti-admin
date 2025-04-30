// utils/auth.ts
import { authService, odooConfig } from "../services/odooService";

// Add this to a utils or debug file
export async function checkAuthStatus() {
  try {
    const session = authService.getSession();
    
    // Prepare headers with session information
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add session information to headers as fallback
    if (session) {
      if (session.sessionId) {
        // Extract just the session ID value, not the full cookie string
        const sessionIdValue = session.sessionId.replace('session_id=', '');
        headers['X-Odoo-Session-ID'] = sessionIdValue;
      }
      
      if (session.uid) {
        headers['X-Odoo-User-ID'] = session.uid.toString();
      }
      
      if (session.companyId) {
        headers['X-Company-ID'] = session.companyId.toString();
      }
    }
    
    // Make a request to debug endpoint
    const response = await fetch(`${odooConfig.baseUrl}/api/debug/session`, {
      method: 'GET',
      credentials: 'include', // Important for cookies
      headers: headers,
    });
    
    const data = await response.json();
    console.log('Auth status check:', {
      requestHeaders: headers,
      response: data,
      currentSession: session,
    });
    
    return data;
  } catch (error) {
    console.error('Auth check failed:', error);
    return { 
      status: 'error', 
      error: error instanceof Error ? error.message : String(error),
      currentSession: authService.getSession()
    };
  }
}