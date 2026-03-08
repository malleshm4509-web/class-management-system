// src/pages/Index.tsx
// Modern CMS page — removed duplicate nav earlier. This full file includes the 3D-styled welcome card (logged-in view).
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const LS_SESSION = "app_session_v1";
const KNOWN_EMAILS_KEY = "known_emails_v1";

const setLocalSession = (payload: any) => {
  try {
    if (!payload) localStorage.removeItem(LS_SESSION);
    else localStorage.setItem(LS_SESSION, JSON.stringify(payload));
  } catch {}
};
const getLocalSession = () => {
  try {
    const raw = localStorage.getItem(LS_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const getKnownEmails = (): string[] => {
  try {
    const raw = localStorage.getItem(KNOWN_EMAILS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};
const saveKnownEmail = (email: string) => {
  try {
    if (!email) return;
    const list = getKnownEmails();
    const normalized = email.trim().toLowerCase();
    if (!list.includes(normalized)) {
      list.unshift(normalized);
      localStorage.setItem(KNOWN_EMAILS_KEY, JSON.stringify(list.slice(0, 20)));
    }
  } catch {}
};

export default function Index() {
  // session and UI state
  const [user, setUser] = useState(() => getLocalSession());
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [knownEmails, setKnownEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setKnownEmails(getKnownEmails());
    const onStorage = () => setUser(getLocalSession());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    setLoginError(null);
    setSignupError(null);
  }, [email, password, name]);

  const extractMessage = (err: any) => {
    try {
      return (
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : undefined) ||
        err?.message ||
        "Request failed"
      );
    } catch {
      return "Request failed";
    }
  };

  // ----- AUTH FLOWS (unchanged behaviour) -----
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();
      if (!trimmedEmail || !password) {
        setSignupError("Email and password are required.");
        setLoading(false);
        return;
      }

      let createRes: any = null;
      try {
        createRes = await api.post("/users", {
          email: trimmedEmail,
          password,
          name: trimmedName || trimmedEmail.split("@")[0],
        });
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          // fallback common route
          createRes = await api.post("/auth/register", {
            email: trimmedEmail,
            password,
            name: trimmedName || trimmedEmail.split("@")[0],
          });
        } else {
          throw err;
        }
      }

      // save known email for suggestions
      saveKnownEmail(trimmedEmail);
      setKnownEmails(getKnownEmails());

      const created = createRes?.data ?? null;
      if (created && (created.token || created.accessToken || created.id || created.email)) {
        const session = {
          id: created.id ?? created.userId ?? created._id ?? null,
          email: created.email ?? trimmedEmail,
          name: created.name ?? (trimmedName || trimmedEmail.split("@")[0]),
          token: created.token ?? created.accessToken ?? undefined,
        };
        if (session.token && (api as any).defaults) {
          try {
            (api as any).defaults.headers = (api as any).defaults.headers || {};
            (api as any).defaults.headers.common = (api as any).defaults.headers.common || {};
            (api as any).defaults.headers.common["Authorization"] = `Bearer ${session.token}`;
          } catch {}
        }
        setLocalSession(session);
        setUser(session);
        toast({ title: "Welcome!", description: "Account created and signed in" });
        navigate("/students");
        setLoading(false);
        return;
      }

      // else try login then
      try {
        const loginRes = await api.post("/auth/login", { email: trimmedEmail, password });
        const logged = loginRes?.data ?? {};
        const session = {
          id: logged.id ?? logged.userId ?? null,
          email: logged.email ?? trimmedEmail,
          name: logged.name ?? (trimmedName || trimmedEmail.split("@")[0]),
          token: logged.token ?? logged.accessToken ?? undefined,
        };
        if (session.token && (api as any).defaults) {
          try {
            (api as any).defaults.headers = (api as any).defaults.headers || {};
            (api as any).defaults.headers.common = (api as any).defaults.headers.common || {};
            (api as any).defaults.headers.common["Authorization"] = `Bearer ${session.token}`;
          } catch {}
        }
        setLocalSession(session);
        setUser(session);
        toast({ title: "Signed up", description: "Account created successfully" });
        navigate("/students");
      } catch {
        toast({ title: "Account created", description: "Please sign in to continue." });
        setSignupError("Account created but auto-login failed. Please sign in.");
      }
    } catch (err: any) {
      const msg = extractMessage(err);
      setSignupError(msg);
      toast({ title: "Signup failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);
    try {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed || !password) {
        setLoginError("Email and password are required.");
        setLoading(false);
        return;
      }
      const res = await api.post("/auth/login", { email: trimmed, password });
      const payload = res.data;
      const session = {
        id: payload.id ?? payload.userId ?? null,
        email: payload.email ?? trimmed,
        name: payload.name ?? trimmed.split("@")[0],
        token: payload.token ?? payload.accessToken ?? undefined,
      };
      if (session.token && (api as any).defaults) {
        try {
          (api as any).defaults.headers = (api as any).defaults.headers || {};
          (api as any).defaults.headers.common = (api as any).defaults.headers.common || {};
          (api as any).defaults.headers.common["Authorization"] = `Bearer ${session.token}`;
        } catch {}
      }

      saveKnownEmail(trimmed);
      setKnownEmails(getKnownEmails());

      setLocalSession(session);
      setUser(session);
      toast({ title: "Signed in", description: "Welcome back!" });
      navigate("/students");
    } catch (err) {
      setLoginError("Incorrect email or password.");
      setShakeKey((k) => k + 1);
      toast({ title: "Login failed", description: "Incorrect email or password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    setLocalSession(null);
    setUser(null);
    toast({ title: "Signed out", description: "You have been signed out." });
    navigate("/");
  };

  // clear fields on tab change (as requested)
  const handleTabChange = (val: string) => {
    setName("");
    setEmail("");
    setPassword("");
    setActiveTab(val === "signup" ? "signup" : "login");
    setLoginError(null);
    setSignupError(null);
  };

  // suggestions: filtered startsWith (case-insensitive)
  const typed = email.trim().toLowerCase();
  const suggestions =
    activeTab === "login" && typed.length > 0
      ? knownEmails.filter((k) => k.startsWith(typed)).slice(0, 8)
      : [];

  // ---------- RENDER: logged-in dashboard ----------
  if (user) {
    return (
      <div className="min-h-screen bg-white">
        {/* NOTE: duplicate nav removed here so only your global nav (if any) shows */}
        <main className="min-h-[calc(100vh-64px)] p-10" style={{
          background: "radial-gradient(circle at 10% 20%, #f0f7ff 0%, transparent 25%), radial-gradient(circle at 90% 80%, #fff7f0 0%, transparent 25%), linear-gradient(180deg,#fbfdff,#f3f7fb)"
        }}>
          <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <section className="space-y-8">
              <h1 className="text-5xl font-extrabold text-[#24313f]">Class Management System</h1>
              <p className="text-lg text-[#6f7a90]">A polished system to manage students, attendance and reports efficiently.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link to="/students" className="p-6 rounded-2xl bg-white shadow hover:shadow-md transition">Manage Students</Link>
                <Link to="/attendance" className="p-6 rounded-2xl bg-white shadow hover:shadow-md transition">Take Attendance</Link>
                <Link to="/marks" className="p-6 rounded-2xl bg-white shadow hover:shadow-md transition">Marks</Link>
                <Link to="/reports" className="p-6 rounded-2xl bg-white shadow hover:shadow-md transition">Reports</Link>
              </div>
            </section>

            <aside className="flex items-center justify-center">
              {/* 3D sky-blue card */}
              <div className="card-3d-wrapper w-full max-w-md">
                <div className="card-3d">
                  <div className="card-3d-inner">
                    <div className="card-3d-top" />
                    <div className="card-3d-body">
                      <div className="flex justify-center -mt-6 mb-2">
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center"
                          style={{ background: "linear-gradient(180deg,#66b8f7,#4fb0f3)", boxShadow: "0 8px 24px rgba(79,176,243,0.18)" }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M16 11a3 3 0 11-6 0 3 3 0 016 0zM6 20v-1a4 4 0 014-4h0" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold text-[#0f2433] text-center">Welcome</h3>
                      <p className="text-sm text-[#47697d] text-center mt-1">Signed in as</p>

                      <div className="text-sm font-medium text-[#0f2433] text-center mt-4">{user.email}</div>
                    </div>
                    <div className="card-3d-shadow" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  // ---------- RENDER: not logged-in (official modern landing + form) ----------
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
      {/* Background: elegant navy-blue gradient + soft orbs */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg,#f7fbff 0%, #eef6fb 50%, #fdfcff 100%)"
        }} />
        {/* decorative orbs */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 800" style={{ opacity: 0.16 }}>
          <defs>
            <linearGradient id="orbA" x1="0" x2="1">
              <stop offset="0" stopColor="#e6f7ff" />
              <stop offset="1" stopColor="#fff0f6" />
            </linearGradient>
            <linearGradient id="orbB" x1="0" x2="1">
              <stop offset="0" stopColor="#eaf6ff" />
              <stop offset="1" stopColor="#e6fff4" />
            </linearGradient>
          </defs>
          <g fill="url(#orbA)">
            <ellipse cx="180" cy="220" rx="320" ry="300"></ellipse>
          </g>
          <g fill="url(#orbB)">
            <ellipse cx="980" cy="600" rx="300" ry="280"></ellipse>
          </g>
        </svg>
      </div>

      <div className="min-h-screen flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* left side hero (text) */}
          <div className="order-2 lg:order-1 px-4 lg:px-0 text-center lg:text-left">
            <h1 className="text-5xl font-extrabold text-[#24313f]">Class Management System</h1>
            <p className="mt-4 text-lg text-[#6f7a90] max-w-xl">
              Modern, secure, and easy-to-use platform for managing students, attendance and academic records.
            </p>

            {/* Removed Get Started and Learn More buttons as requested */}
          </div>

          {/* right side: auth card */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-white/60 p-8">
                {/* small decorative accent */}
                <div className="flex justify-center -mt-12 mb-2">
                  <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(180deg,#66b8f7,#4fb0f3)", boxShadow: "0 6px 20px rgba(79,176,243,0.18)" }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M16 11a3 3 0 11-6 0 3 3 0 016 0zM6 20v-1a4 4 0 014-4h0" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>

                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-[#24313f]">Welcome back</h2>
                  <p className="text-sm text-[#6f7a90] mt-1">Sign in to access your dashboard</p>
                </div>

                <Tabs defaultValue="login" onValueChange={handleTabChange}>
                  <div className="mb-4">
                    <TabsList className="grid grid-cols-2 p-1 rounded-lg bg-white/60">
                      <TabsTrigger value="login" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#66b8f7] data-[state=active]:to-[#4fb0f3] data-[state=active]:text-white px-6 py-3 rounded-lg text-sm font-medium">Login</TabsTrigger>
                      <TabsTrigger value="signup" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#66b8f7] data-[state=active]:to-[#4fb0f3] data-[state=active]:text-white px-6 py-3 rounded-lg text-sm font-medium">Sign Up</TabsTrigger>
                    </TabsList>
                  </div>

                  <div>
                    <TabsContent value="login" className={`space-y-4 ${shakeKey > 0 ? "animate-[shakeX_0.45s_ease-in-out]" : ""}`}>
                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div>
                          <Label className="block text-sm font-medium text-[#24313f]">Email</Label>
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="mt-2"
                          />
                          {suggestions.length > 0 && (
                            <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-sm max-h-36 overflow-auto text-sm">
                              {suggestions.map(s => (
                                <button key={s} onClick={() => setEmail(s)} type="button" className="w-full text-left px-3 py-2 hover:bg-gray-100">{s}</button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <Label className="block text-sm font-medium text-[#24313f]">Password</Label>
                          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2" />
                        </div>

                        {loginError && <div className="text-sm text-red-600">{loginError}</div>}

                        <Button type="submit" className="w-full h-12 rounded-lg" disabled={loading} style={{ background: "linear-gradient(90deg,#66b8f7,#4fb0f3)" }}>
                          {loading ? "Signing in..." : "Sign In"}
                        </Button>
                      </form>
                      {/* Removed "Forgot password? Contact your administrator." as requested */}
                    </TabsContent>

                    <TabsContent value="signup" className="space-y-4">
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div>
                          <Label className="block text-sm font-medium text-[#24313f]">Full name</Label>
                          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-2" autoComplete="name" />
                        </div>

                        <div>
                          <Label className="block text-sm font-medium text-[#24313f]">Email</Label>
                          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2" autoComplete="email" />
                        </div>

                        <div>
                          <Label className="block text-sm font-medium text-[#24313f]">Password</Label>
                          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2" autoComplete="new-password" />
                        </div>

                        {signupError && <div className="text-sm text-red-600">{signupError}</div>}

                        <Button type="submit" className="w-full h-12 rounded-lg" disabled={loading} style={{ background: "linear-gradient(90deg,#66b8f7,#4fb0f3)" }}>
                          {loading ? "Creating..." : "Create account"}
                        </Button>
                      </form>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              {/* footer small */}
              <div className="text-center text-xs text-[#9aa4b2] mt-3">© {new Date().getFullYear()} CMS — All rights reserved</div>
            </div>
          </div>
        </div>
      </div>

      {/* small shake keyframes for login failure and 3D card CSS */}
      <style>{`
        @keyframes shakeX {
          0% { transform: translateX(0) }
          15% { transform: translateX(-6px) }
          30% { transform: translateX(6px) }
          45% { transform: translateX(-4px) }
          60% { transform: translateX(4px) }
          75% { transform: translateX(-2px) }
          100% { transform: translateX(0) }
        }
        .animate-[shakeX_0.45s_ease-in-out] { animation: shakeX .45s ease-in-out; }

        /* 3D card styles */
        .card-3d-wrapper { perspective: 1200px; -webkit-perspective: 1200px; }
        .card-3d {
          transform-style: preserve-3d;
          transition: transform 450ms cubic-bezier(.2,.9,.3,1);
        }
        .card-3d-inner {
          position: relative;
          border-radius: 12px;
          overflow: visible;
        }
        .card-3d-top {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          background: linear-gradient(180deg,#e7f4ff,#d9efff);
          transform: translateZ(30px) rotateX(6deg);
          filter: blur(12px);
          opacity: 0.55;
          pointer-events: none;
        }
        .card-3d-body {
          position: relative;
          z-index: 4;
          border-radius: 12px;
          padding: 28px 26px;
          background: linear-gradient(180deg,#eaf6ff,#dff5ff);
          box-shadow:
            0 10px 30px rgba(16,30,45,0.12),
            0 2px 8px rgba(16,30,45,0.06);
          transform: translateZ(18px) translateY(-6px) rotateX(4deg);
        }

        /* subtle layered rim for 3D feel */
        .card-3d-inner::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 12px;
          background: linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0.06));
          mix-blend-mode: overlay;
          pointer-events: none;
          z-index: 3;
        }

        .card-3d-shadow {
          position: absolute;
          left: 8%;
          right: 8%;
          bottom: -18px;
          height: 22px;
          background: radial-gradient(60% 60% at 50% 50%, rgba(14,26,40,0.14), rgba(14,26,40,0.06) 40%, transparent 60%);
          border-radius: 50%;
          transform: translateZ(-10px) scale(0.98);
          z-index: 1;
        }

        /* small hover tilt on larger screens */
        @media (hover: hover) and (min-width: 900px) {
          .card-3d-wrapper:hover .card-3d {
            transform: translateY(-6px) rotateX(6deg) rotateY(-4deg);
          }
          .card-3d-wrapper:hover .card-3d-body {
            transform: translateZ(22px) translateY(-10px) rotateX(6deg);
            box-shadow:
              0 18px 48px rgba(16,30,45,0.18),
              0 6px 18px rgba(16,30,45,0.08);
          }
        }

        /* make the 3D card responsive and look good on mobile */
        @media (max-width: 640px) {
          .card-3d-body { transform: none; padding: 22px; }
          .card-3d-top { display: none; }
          .card-3d-shadow { display: none; }
        }
      `}</style>
    </div>
  );
}
