import { AuthProvider } from "@/components/layout/AuthProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-full items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </AuthProvider>
  );
}
