"""
Handles user authentication using Supabase Auth.
"""
from supabase import create_client, Client
from src.config import SUPABASE_URL, SUPABASE_KEY
from typing import Optional

class AuthManager:
    """
    Manages user sign-up, sign-in, and session state with Supabase.
    """
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("Supabase URL and Key must be set in the .env file.")
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.auth = self.client.auth

    def sign_up(self, email: str, password: str) -> Optional[dict]:
        """
        Signs up a new user.

        Returns:
            The user session object on success, None on failure.
        """
        try:
            response = self.auth.sign_up({"email": email, "password": password})
            print("✅ Sign-up successful! Please check your email for verification.")
            # Note: Supabase may require email verification before login is possible.
            # This depends on your Supabase project settings.
            return response.session
        except Exception as e:
            print(f"❌ Sign-up failed: {e}")
            return None

    def sign_in(self, email: str, password: str) -> Optional[dict]:
        """
        Signs in an existing user.

        Returns:
            The user session object on success, None on failure.
        """
        try:
            response = self.auth.sign_in_with_password({"email": email, "password": password})
            print(f"✅ Login successful! Welcome back, {response.user.email}.")
            return response.session
        except Exception as e:
            print(f"❌ Login failed: {e}")
            return None

    def sign_out(self):
        """Signs out the current user."""
        try:
            self.auth.sign_out()
            print("👋 You have been successfully signed out.")
        except Exception as e:
            print(f"❌ Sign-out failed: {e}")

    def get_user_id_from_email(self, email: str) -> Optional[str]:
        """
        Retrieves the user ID for a given email address.
        Note: This requires admin privileges on the Supabase client.
        The standard client might not have permission to query auth.users.
        If this fails, you may need to create a service role client
        or a database function to achieve this securely.
        """
        try:
            # This is a simplified approach. In a production environment,
            # you should handle this with more robust error checking and security.
            # The `auth.admin.list_users()` method might be an option with an admin client.
            # A more secure way is to create a DB function that can be called.
            # For this project, we'll try a direct query.
            response = self.client.table('users').select('id').eq('email', email).execute()
            if response.data:
                return response.data[0]['id']
            return None
        except Exception as e:
            print(f"❌ Could not retrieve user ID for email {email}: {e}")
            return None 