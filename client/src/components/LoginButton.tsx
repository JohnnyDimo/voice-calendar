import type { CurrentUser } from "../lib/api";

interface LoginButtonProps {
  user: CurrentUser | null;
}

export function LoginButton({ user }: LoginButtonProps) {
  if (user) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        {user.picture && (
          <img src={user.picture} alt="" className="h-7 w-7 rounded-full" />
        )}
        <span>{user.name}</span>
        <a href="/auth/logout" className="text-indigo-600 underline">
          Sign out
        </a>
      </div>
    );
  }

  return (
    <a
      href="/auth/google"
      className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
    >
      Sign in with Google
    </a>
  );
}
