import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8">
        <LoginForm />
      </div>
    </div>
  )
}
