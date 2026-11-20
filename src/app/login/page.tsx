import Link from "next/link";
import AuthCard from "@/components/auth/auth-card";
import { GuestGate } from "@/components/auth/auth-guard";
import EmailLoginForm from "@/components/auth/email-login-form";
import GoogleLoginButton from "@/components/auth/google-login-button";
import { ROUTES } from "@/constants";

export default function LoginPage() {
  return (
    <GuestGate>

      <AuthCard title="다시 만나서 반가워요">
        <EmailLoginForm />

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="lbl">또는</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <GoogleLoginButton />

        <p className="mt-6 border-t border-line pt-5 text-center text-[14px] text-ink-2">
          계정이 없으신가요?{" "}
          <Link href={ROUTES.signup} className="font-semibold text-ink underline decoration-line-2 underline-offset-2 hover:decoration-ink">
            ODY 가입하기
          </Link>
        </p>

        <p className="mt-2.5 text-center text-[11px] leading-[1.5] text-ink-4 max-[428px]:text-[9.2px]">
          로그인하면 이용약관과 개인정보 처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </AuthCard>
    </GuestGate>
  );
}
