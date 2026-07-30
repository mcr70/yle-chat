// auth-callback.component.ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-auth-callback',
  template: '<div style="display: flex; justify-content: center; margin-top: 50px; font-family: sans-serif;">Logging you in...</div>'
})
export class AuthCallbackComponent implements OnInit {
  
  ngOnInit(): void {
    // Parse the URL parameters provided by Sanoma's redirect
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    // If we are inside a popup window (which we should be)
    if (window.opener) {
      // Post the message back to the main Angular application window
      window.opener.postMessage(
        { 
          type: 'SANOMA_AUTH_SUCCESS', 
          code: code, 
          state: state 
        },
        window.location.origin
      );
      
      // Close the popup automatically
      window.close();
    }
  }
}