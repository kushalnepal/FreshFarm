
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Try to sign in as admin
      await signIn(email, password);
      
      // Check if user has admin role
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.role === 'ADMIN') {
          toast({
            title: "Admin Login Successful",
            description: "Welcome to the admin panel!",
          });
          navigate("/admin");
        } else {
          setError("Access denied. Admin privileges required.");
          // Sign out non-admin user
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
        }
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-farm-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-farm-green-dark flex items-center justify-center text-white font-bold text-xl">F</div>
            <div className="font-poppins font-bold text-xl">
              <span className="text-farm-green-dark">Farm</span>
              <span className="text-farm-brown-dark">Fresh</span>
            </div>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-farm-green-dark flex items-center justify-center mx-auto mb-4">
              <Lock className="text-white" size={32} />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>
              Access the admin panel to manage products and sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-farm-green-dark hover:bg-farm-green-light"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In as Admin"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <div className="bg-blue-50 p-3 rounded-md mb-4">
                <p className="text-sm text-blue-800 font-medium">Demo Info:</p>
                <p className="text-xs text-blue-600">Sign up with role: ADMIN to access admin panel</p>
                <p className="text-xs text-blue-600">Or use regular login if you already have an admin account</p>
              </div>
              
              <Link 
                to="/" 
                className="text-sm text-gray-500 hover:text-farm-green-dark"
              >
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
