import Footer from "@/components/Footer";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Sign in or sign up | Russ fan archive (unofficial)",
  description: "Sign in or make a free account to keep your Russ favorites and top 10 on every device.",
  alternates: { canonical: "/login" },
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <>
      <LoginForm />
      <Footer newsletter={false} />
    </>
  );
}
