import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const Auth = () => {
  const { session, loading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Se o e-mail existir, enviaremos um link de recuperação.");
    setForgotOpen(false);
  };

  if (loading) return null;
  if (session) return <Navigate to="/app" replace />;

  const translateAuthError = (msg: string): { text: string; hint?: "forgot" } => {
    const m = (msg || "").toLowerCase();
    if (m.includes("invalid login credentials") || m.includes("invalid_credentials")) {
      return { text: "E-mail ou senha incorretos. Verifique e tente novamente.", hint: "forgot" };
    }
    if (m.includes("email not confirmed")) return { text: "E-mail ainda não confirmado. Verifique sua caixa de entrada." };
    if (m.includes("user not found")) return { text: "Usuário não encontrado. Confira o e-mail digitado." };
    if (m.includes("too many requests") || m.includes("rate limit")) return { text: "Muitas tentativas. Aguarde alguns instantes e tente novamente." };
    if (m.includes("network")) return { text: "Falha de conexão. Verifique sua internet e tente novamente." };
    return { text: msg || "Não foi possível entrar. Tente novamente." };
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setBusy(false);
      const t = translateAuthError(error.message);
      toast.error(t.text, t.hint === "forgot" ? {
        action: { label: "Esqueci minha senha", onClick: () => { setForgotEmail(email); setForgotOpen(true); } },
        duration: 8000,
      } : undefined);
      return;
    }
    toast.success("Bem-vindo!");
    window.location.assign("/app");
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name: fullName || email.split("@")[0] },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      toast.success("Conta criada! Entrando…");
      window.location.assign("/app");
    } else {
      toast.success("Conta criada! Faça login para continuar.");
      setTab("signin");
    }
  };

  const signInGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-display text-2xl font-bold">
            O
          </div>
          <CardTitle className="font-display text-2xl">ERP OCS</CardTitle>
          <CardDescription>Oriente Conecte Soluções</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form className="space-y-3 mt-4" onSubmit={signIn}>
                <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div><Label>Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form className="space-y-3 mt-4" onSubmit={signUp}>
                <div><Label>Nome</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
                <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div><Label>Senha</Label><Input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "Criando…" : "Criar conta"}</Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={signInGoogle}>
            Continuar com Google
          </Button>
        </CardContent>
      </Card>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Recuperar senha</DialogTitle></DialogHeader>
          <form onSubmit={sendReset} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={forgotBusy}>{forgotBusy ? "Enviando…" : "Enviar link"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
