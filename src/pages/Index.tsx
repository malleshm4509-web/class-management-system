// src/pages/Index.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const LS_SESSION = "app_session_v1";
const KNOWN_EMAILS_KEY = "known_emails_v1";

const setLocalSession = (payload: any) => {
  if (!payload) localStorage.removeItem(LS_SESSION);
  else localStorage.setItem(LS_SESSION, JSON.stringify(payload));
};

const getLocalSession = () => {
  const raw = localStorage.getItem(LS_SESSION);
  return raw ? JSON.parse(raw) : null;
};

const getKnownEmails = (): string[] => {
  const raw = localStorage.getItem(KNOWN_EMAILS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveKnownEmail = (email: string) => {
  if (!email) return;
  const list = getKnownEmails();
  const normalized = email.trim().toLowerCase();

  if (!list.includes(normalized)) {
    list.unshift(normalized);
    localStorage.setItem(KNOWN_EMAILS_KEY, JSON.stringify(list.slice(0, 20)));
  }
};

export default function Index() {

  const [user, setUser] = useState(() => getLocalSession());

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [knownEmails, setKnownEmails] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);

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

  const extractMessage = (err: any) =>
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    "Request failed";

  const handleTabChange = (val: string) => {
    setName("");
    setEmail("");
    setPassword("");
    setActiveTab(val === "signup" ? "signup" : "login");
    setLoginError(null);
    setSignupError(null);
  };

  // ---------------- SIGNUP ----------------

  const handleSignUp = async (e: React.FormEvent) => {

    e.preventDefault();
    setSignupError(null);
    setLoading(true);

    try {

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();

      await api.post("/auth/signup", {
        email: trimmedEmail,
        password,
        name: trimmedName || trimmedEmail.split("@")[0],
      });

      const loginRes = await api.post("/auth/login", {
        email: trimmedEmail,
        password,
      });

      const payload = loginRes.data;

      const session = {
        id: payload.id,
        name: payload.name,
        email: payload.email,
      };

      setLocalSession(session);
      setUser(session);

      saveKnownEmail(trimmedEmail);
      setKnownEmails(getKnownEmails());

      toast({
        title: "Account created",
        description: "Welcome!",
      });

      navigate("/students");

    } catch (err: any) {

      const msg = extractMessage(err);

      setSignupError(msg);

      toast({
        title: "Signup failed",
        description: msg,
        variant: "destructive",
      });

    } finally {
      setLoading(false);
    }
  };

  // ---------------- LOGIN ----------------

  const handleSignIn = async (e: React.FormEvent) => {

    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {

      const trimmed = email.trim().toLowerCase();

      const res = await api.post("/auth/login", {
        email: trimmed,
        password,
      });

      const payload = res.data;

      const session = {
        id: payload.id,
        name: payload.name,
        email: payload.email,
      };

      setLocalSession(session);
      setUser(session);

      saveKnownEmail(trimmed);
      setKnownEmails(getKnownEmails());

      toast({
        title: "Signed in",
        description: "Welcome back!",
      });

      navigate("/students");

    } catch {

      setLoginError("Incorrect email or password");

      toast({
        title: "Login failed",
        description: "Incorrect email or password",
        variant: "destructive",
      });

    } finally {
      setLoading(false);
    }
  };

  const typed = email.trim().toLowerCase();

  const suggestions =
    activeTab === "login" && typed.length > 0
      ? knownEmails.filter((k) => k.startsWith(typed)).slice(0, 8)
      : [];

  // ---------------- DASHBOARD ----------------

  if (user) {
    return (
      <div className="min-h-screen p-10">
        <h1 className="text-4xl font-bold mb-8">Class Management System</h1>

        <div className="grid grid-cols-2 gap-4 max-w-md">

          <Link to="/students">
            <Button className="w-full">Students</Button>
          </Link>

          <Link to="/attendance">
            <Button className="w-full">Attendance</Button>
          </Link>

          <Link to="/marks">
            <Button className="w-full">Marks</Button>
          </Link>

          <Link to="/reports">
            <Button className="w-full">Reports</Button>
          </Link>

        </div>

        <div className="mt-10 text-gray-600">
          Signed in as <b>{user.email}</b>
        </div>
      </div>
    );
  }

  // ---------------- LOGIN / SIGNUP ----------------

 return (
  <div className="min-h-screen w-full bg-[#f3f4f6] flex items-center justify-center">

    <div className="w-full max-w-6xl grid grid-cols-2 gap-24 items-center px-8">

      {/* LEFT SIDE */}
      <div>

        <h1 className="text-[64px] font-bold text-gray-800 leading-tight">
          Class <br />
          Management <br />
          System
        </h1>

        <p className="mt-6 text-gray-500 text-lg max-w-md">
          Modern, secure, and easy-to-use platform for managing students,
          attendance and academic records.
        </p>

      </div>

      {/* RIGHT LOGIN CARD */}
      <div className="flex justify-center">

        <div className="bg-white w-[380px] rounded-2xl shadow-xl p-8 relative">

          {/* ICON */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">

            <div className="bg-blue-500 w-20 h-20 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">
              🔑
            </div>

          </div>

          <div className="mt-12 text-center">

            <h2 className="text-2xl font-semibold text-gray-800">
              Welcome back
            </h2>

            <p className="text-gray-500 mt-1">
              Sign in to access your dashboard
            </p>

          </div>

          <Tabs defaultValue="login" onValueChange={handleTabChange} className="mt-6">

           <TabsList className="grid grid-cols-2 mb-6 bg-gray-100 p-1 rounded-lg">

  <TabsTrigger
    value="login"
    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md"
  >
    Login
  </TabsTrigger>

  <TabsTrigger
    value="signup"
    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md"
  >
    Sign Up
  </TabsTrigger>

</TabsList>

            {/* LOGIN */}

            <TabsContent value="login">

              <form onSubmit={handleSignIn} className="space-y-4">

                <div>

                  <Label>Email</Label>

                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    required
                  />

                </div>

                <div>

                  <Label>Password</Label>

                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                    required
                  />

                </div>

                {loginError && (
                  <p className="text-red-500 text-sm">{loginError}</p>
                )}

                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white mt-2">
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

              </form>

            </TabsContent>

            {/* SIGNUP */}

            <TabsContent value="signup">

              <form onSubmit={handleSignUp} className="space-y-4">

                <div>

                  <Label>Full Name</Label>

                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1"
                  />

                </div>

                <div>

                  <Label>Email</Label>

                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    required
                  />

                </div>

                <div>

                  <Label>Password</Label>

                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                    required
                  />

                </div>

                {signupError && (
                  <p className="text-red-500 text-sm">{signupError}</p>
                )}

                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  {loading ? "Creating..." : "Create Account"}
                </Button>

              </form>

            </TabsContent>

          </Tabs>

          <p className="text-center text-gray-400 text-sm mt-6">
            © 2026 CMS — All rights reserved
          </p>

        </div>

      </div>

    </div>

  </div>
);
}