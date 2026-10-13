import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Loader2 } from "lucide-react";
import { setUser } from "@/Redex/service/auth/Userinfo";

export default function GoogleCallbackHandler() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    if (oauthError) {
      navigate(`/signin?error=${encodeURIComponent(oauthError)}`, {
        replace: true,
      });
      return;
    }

    const accessToken = params.get("accessToken") || "";
    const refreshToken = params.get("refreshToken") || "";

    if (!accessToken) {
      navigate("/signin?error=Google%20sign-in%20did%20not%20return%20a%20session", {
        replace: true,
      });
      return;
    }

    dispatch(
      setUser({
        userId: params.get("userId") || "",
        name: params.get("name") || "",
        email: params.get("email") || "",
        image: params.get("image") || "",
        role: params.get("role") || "USER",
        accessToken,
        refreshToken,
        emailVerified: true,
      })
    );

    const role = String(params.get("role") || "USER").toUpperCase();
    navigate(role === "SUPER_ADMIN" ? "/admin" : "/dashboard", {
      replace: true,
    });
  }, [dispatch, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-brand-bg text-brand-dark">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">Signing you in with Google…</p>
    </div>
  );
}
